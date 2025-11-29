import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateDuration, sortTasksByTime, formatDuration, getTodayString } from '../utils/time';
import { X, Save, Upload, Trash2, Plus } from 'lucide-react';

const ScheduleEditor = ({ close }) => {
    const [tasks, setTasks] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [applyToToday, setApplyToToday] = useState(false);

    useEffect(() => {
        const fetchBase = async () => {
            const docSnap = await getDoc(doc(db, 'schedules', 'base'));
            if (docSnap.exists()) setTasks(docSnap.data().tasks || []);
        };
        fetchBase();
    }, []);

    const handleSave = async () => {
        const sortedTasks = sortTasksByTime(tasks);
        await setDoc(doc(db, 'schedules', 'base'), { tasks: sortedTasks, updatedAt: new Date() });

        if (applyToToday) {
            const today = getTodayString();
            const dailyRef = doc(db, 'schedules', 'daily');
            const dailySnap = await getDoc(dailyRef);
            let currentPenalties = dailySnap.exists() ? dailySnap.data().penalties || [] : [];

            // Weekend Logic
            const dayOfWeek = new Date().getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            let activeTasks = [];

            if (!isWeekend) {
                activeTasks = sortedTasks.map(t => ({
                    ...t, completed: false, partiallyCompleted: false, remaining: 0
                }));
            } else {
                alert("Base saved. Weekend Protocol: Today's tasks cleared.");
            }

            await setDoc(dailyRef, {
                date: today,
                tasks: activeTasks,
                penalties: currentPenalties,
                lastRun: today
            });
            window.location.reload();
        } else {
            setIsDirty(false);
            close();
        }
    };

    const handleChange = (index, field, value) => {
        const newTasks = [...tasks];
        newTasks[index][field] = value;
        if (field === 'start' || field === 'end') {
            const { start, end } = newTasks[index];
            if (start && end) newTasks[index].duration = calculateDuration(start, end);
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
                const processed = json.map(t => ({...t, duration: calculateDuration(t.start, t.end)}));
                if (confirm("Replace existing schedule?")) setTasks(processed);
                else setTasks([...tasks, ...processed]);
                setIsDirty(true);
            } catch (err) { alert("Invalid JSON"); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex justify-end">
            <div className="w-full max-w-lg bg-surface border-l border-cyan-900/50 h-full p-6 overflow-y-auto shadow-2xl relative">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">
                        System Configuration
                    </h2>
                    <button onClick={close} className="p-2 hover:bg-gray-800 rounded text-cyan-500"><X /></button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 hover:border-cyan-500 cursor-pointer text-xs font-mono uppercase text-gray-300 transition-all flex-1 justify-center">
                            <Upload size={14} /> Import JSON
                            <input type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
                        </label>
                        
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-3 bg-cyan-900/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black text-xs font-mono uppercase font-bold transition-all flex-1 justify-center"
                        >
                            <Save size={14} /> Commit Changes
                        </button>
                    </div>

                    <label className="flex items-center gap-3 p-3 border border-gray-800 bg-black/50 cursor-pointer hover:border-gray-600 transition">
                        <input 
                            type="checkbox" 
                            checked={applyToToday} 
                            onChange={(e) => setApplyToToday(e.target.checked)}
                            className="w-4 h-4 rounded-none accent-cyan-500 bg-gray-900 border-gray-700" 
                        />
                        <div>
                            <span className={applyToToday ? "text-cyan-400 font-bold text-sm uppercase" : "text-gray-400 text-sm uppercase"}>
                                Force Override Today
                            </span>
                            {applyToToday && <p className="text-[10px] text-crimson-500 font-mono mt-1">WARNING: WIPES CURRENT PROGRESS</p>}
                        </div>
                    </label>
                </div>

                {/* List */}
                <div className="space-y-4 pb-20">
                    {tasks.map((task, idx) => (
                        <div key={idx} className="bg-black p-4 border border-gray-800 hover:border-cyan-800 transition grid gap-3">
                            <div className="flex justify-between items-center">
                                <input 
                                    className="bg-transparent border-b border-gray-800 focus:border-cyan-500 outline-none w-full text-white font-mono text-sm uppercase tracking-wider placeholder-gray-700"
                                    value={task.label}
                                    onChange={(e) => handleChange(idx, 'label', e.target.value)}
                                    placeholder="PROTOCOL NAME"
                                />
                                <button onClick={() => {
                                    const newT = tasks.filter((_,i) => i!==idx);
                                    setTasks(newT);
                                    setIsDirty(true);
                                }} className="text-gray-600 hover:text-crimson-500 ml-2"><Trash2 size={16}/></button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-2 border border-gray-800">
                                    <label className="text-[10px] text-cyan-700 block mb-1 uppercase">Start</label>
                                    <input 
                                        type="time" 
                                        value={task.start} 
                                        onChange={(e) => handleChange(idx, 'start', e.target.value)}
                                        className="bg-transparent text-white w-full text-sm font-mono outline-none"
                                    />
                                </div>
                                <div className="bg-gray-900/50 p-2 border border-gray-800">
                                    <label className="text-[10px] text-cyan-700 block mb-1 uppercase">End</label>
                                    <input 
                                        type="time" 
                                        value={task.end} 
                                        onChange={(e) => handleChange(idx, 'end', e.target.value)}
                                        className="bg-transparent text-white w-full text-sm font-mono outline-none"
                                    />
                                </div>
                            </div>
                            <div className="text-[10px] text-right text-gray-500 font-mono">
                                CALC: {formatDuration(task.duration || 0)}
                            </div>
                        </div>
                    ))}
                
                    <button 
                        onClick={() => {
                            setTasks([...tasks, { label: 'New Directive', start: '09:00', end: '10:00', duration: 60 }]);
                            setIsDirty(true);
                        }} 
                        className="w-full py-4 border border-dashed border-gray-800 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50 flex items-center justify-center gap-2 transition uppercase text-xs font-mono tracking-widest"
                    >
                        <Plus size={16} /> Append Directive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleEditor;