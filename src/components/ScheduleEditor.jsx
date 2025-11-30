import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateDuration, sortTasksByTime, formatDuration, getTodayString } from '../utils/time';
import { X, Save, Upload, Trash2, Plus } from 'lucide-react';

const ScheduleEditor = ({ close, user }) => {
    const [tasks, setTasks] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [applyToToday, setApplyToToday] = useState(false);

    // 1. Load Base Schedule for the specific User
    useEffect(() => {
        const fetchBase = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'users', user.uid, 'schedules', 'base');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTasks(docSnap.data().tasks || []);
                }
            } catch (error) {
                console.error("Error loading schedule:", error);
            }
        };
        fetchBase();
    }, [user]);

    // 2. Save Logic
    const handleSave = async () => {
        if (!user) return;

        const sortedTasks = sortTasksByTime(tasks);
        
        // A. Save the Blueprint (Base)
        await setDoc(doc(db, 'users', user.uid, 'schedules', 'base'), { 
            tasks: sortedTasks, 
            updatedAt: new Date() 
        });

        // B. Optionally Overwrite Today (Daily)
        if (applyToToday) {
            const today = getTodayString();
            const dailyRef = doc(db, 'users', user.uid, 'schedules', 'daily');
            const dailySnap = await getDoc(dailyRef);
            
            // Preserve existing penalties so user doesn't lose debt
            let currentPenalties = dailySnap.exists() ? dailySnap.data().penalties || [] : [];

            // Weekend Logic Check
            const dayOfWeek = new Date().getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0=Sun, 6=Sat
            let activeTasks = [];

            if (!isWeekend) {
                activeTasks = sortedTasks.map(t => ({
                    ...t, 
                    completed: false, 
                    partiallyCompleted: false, 
                    remaining: 0
                }));
            } else {
                alert("Base saved. Weekend Protocol Active: Today's tasks cleared.");
            }

            await setDoc(dailyRef, {
                date: today,
                tasks: activeTasks,
                penalties: currentPenalties,
                lastRun: today
            });
            
            // Reload to reflect changes immediately
            window.location.reload();
        } else {
            setIsDirty(false);
            close();
        }
    };

    // 3. Input Handlers
    const handleChange = (index, field, value) => {
        const newTasks = [...tasks];
        newTasks[index][field] = value;
        
        // Auto-calc duration if times change
        if (field === 'start' || field === 'end') {
            const { start, end } = newTasks[index];
            if (start && end) {
                newTasks[index].duration = calculateDuration(start, end);
            }
        }
        setTasks(newTasks);
        setIsDirty(true);
    };

    const handleJSONUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                // Ensure duration is calculated for uploaded items
                const processed = json.map(t => ({
                    ...t, 
                    duration: calculateDuration(t.start, t.end)
                }));
                
                if (confirm("Replace existing schedule completely? Click Cancel to Append instead.")) {
                    setTasks(processed);
                } else {
                    setTasks([...tasks, ...processed]);
                }
                setIsDirty(true);
            } catch (err) { 
                alert("Invalid JSON format"); 
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[100] flex justify-end">
            <div className="w-full max-w-lg bg-surface border-l border-primary-dim h-full p-6 overflow-y-auto shadow-2xl relative animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b border-text-muted pb-4">
                    <h2 className="text-xl font-bold text-primary-text uppercase tracking-widest">
                        Configuration
                    </h2>
                    <button 
                        onClick={close} 
                        className="p-2 hover:bg-primary-dim rounded-theme text-danger transition-colors"
                    >
                        <X />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2 px-4 py-3 bg-background border border-primary-dim hover:border-primary cursor-pointer text-xs font-mono uppercase text-text-muted transition-all flex-1 justify-center rounded-theme group">
                            <Upload size={14} className="group-hover:text-primary-text"/> 
                            <span>Import JSON</span>
                            <input type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
                        </label>
                        
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-3 bg-primary-dim border border-primary text-primary-text hover:bg-primary hover:text-surface text-xs font-mono uppercase font-bold transition-all flex-1 justify-center rounded-theme"
                        >
                            <Save size={14} /> Commit
                        </button>
                    </div>

                    <label className="flex items-center gap-3 p-3 border border-primary-dim bg-background cursor-pointer hover:border-primary transition rounded-theme group">
                        <input 
                            type="checkbox" 
                            checked={applyToToday} 
                            onChange={(e) => setApplyToToday(e.target.checked)}
                            className="w-4 h-4 rounded-none bg-surface border-text-muted accent-primary" 
                        />
                        <div>
                            <span className={applyToToday ? "text-primary-text font-bold text-sm uppercase" : "text-text-muted text-sm uppercase group-hover:text-text-main"}>
                                Force Override Today
                            </span>
                        </div>
                    </label>
                </div>

                {/* Task List Form */}
                <div className="space-y-4 pb-20">
                    {tasks.map((task, idx) => (
                        <div key={idx} className="bg-background p-4 border border-primary-dim hover:border-primary transition grid gap-3 rounded-theme group">
                            <div className="flex justify-between items-center">
                                <input 
                                    className="bg-transparent border-b border-primary-dim focus:border-primary outline-none w-full text-text-main font-mono text-sm uppercase tracking-wider placeholder-text-muted"
                                    value={task.label}
                                    onChange={(e) => handleChange(idx, 'label', e.target.value)}
                                    placeholder="PROTOCOL NAME"
                                />
                                <button 
                                    onClick={() => {
                                        const newT = tasks.filter((_,i) => i!==idx);
                                        setTasks(newT);
                                        setIsDirty(true);
                                    }} 
                                    className="text-text-muted hover:text-danger ml-2 transition-colors"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-primary-dim/10 p-2 border border-primary-dim rounded-theme">
                                    <label className="text-[10px] text-text-muted block mb-1 uppercase">Start</label>
                                    <input 
                                        type="time" 
                                        value={task.start} 
                                        onChange={(e) => handleChange(idx, 'start', e.target.value)}
                                        className="bg-transparent text-text-main w-full text-sm font-mono outline-none"
                                    />
                                </div>
                                <div className="bg-primary-dim/10 p-2 border border-primary-dim rounded-theme">
                                    <label className="text-[10px] text-text-muted block mb-1 uppercase">End</label>
                                    <input 
                                        type="time" 
                                        value={task.end} 
                                        onChange={(e) => handleChange(idx, 'end', e.target.value)}
                                        className="bg-transparent text-text-main w-full text-sm font-mono outline-none"
                                    />
                                </div>
                            </div>
                            <div className="text-[10px] text-right text-text-muted font-mono">
                                CALC: {formatDuration(task.duration || 0)}
                            </div>
                        </div>
                    ))}
                
                    <button 
                        onClick={() => {
                            setTasks([...tasks, { label: 'New Directive', start: '09:00', end: '10:00', duration: 60 }]);
                            setIsDirty(true);
                        }} 
                        className="w-full py-4 border border-dashed border-primary-dim text-text-muted hover:text-primary-text hover:border-primary flex items-center justify-center gap-2 transition uppercase text-xs font-mono tracking-widest rounded-theme"
                    >
                        <Plus size={16} /> Append Directive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleEditor;