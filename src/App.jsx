import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getTodayString, sortPenalties } from './utils/time';
import TaskList from './components/TaskList';
import PenaltyList from './components/PenaltyList';
import ScheduleEditor from './components/ScheduleEditor';
import { Settings, Cpu, ShieldAlert, Activity } from 'lucide-react';

const App = () => {
  const [dailyData, setDailyData] = useState({ tasks: [], penalties: [], date: '' });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSystem = async () => {
      const today = getTodayString();
      const dailyRef = doc(db, 'schedules', 'daily');
      const dailySnap = await getDoc(dailyRef);

      if (!dailySnap.exists()) {
        await performRollover(today, []); 
      } else {
        const data = dailySnap.data();
        if (data.date !== today) {
          await performRollover(today, data);
        } else {
          setDailyData(data);
        }
      }
      setLoading(false);
    };

    initSystem();
    const interval = setInterval(() => {
      const currentToday = getTodayString();
      if (dailyData.date && currentToday !== dailyData.date) {
        window.location.reload(); 
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [dailyData.date]);

  const performRollover = async (todayStr, previousDailyData) => {
    console.log("INITIALIZING ROLLOVER SEQUENCE...");
    let newPenaltiesMap = {};

    if (previousDailyData.penalties) {
      previousDailyData.penalties.forEach(p => {
        if (!p.completed) newPenaltiesMap[p.label] = (newPenaltiesMap[p.label] || 0) + p.duration;
      });
    }

    if (previousDailyData.tasks) {
      previousDailyData.tasks.forEach(t => {
        if (t.completed) return; 
        let penaltyTime = t.partiallyCompleted ? (t.remaining || 0) : t.duration;
        if (penaltyTime > 0) newPenaltiesMap[t.label] = (newPenaltiesMap[t.label] || 0) + penaltyTime;
      });
    }

    const mergedPenalties = Object.entries(newPenaltiesMap).map(([label, duration]) => ({
      label, duration, completed: false, id: Math.random().toString(36).substr(2, 9)
    }));
    
    const sortedPenalties = sortPenalties(mergedPenalties);
    let newTasks = [];
    
    const dayOfWeek = new Date().getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!isWeekend) {
        const baseRef = doc(db, 'schedules', 'base');
        const baseSnap = await getDoc(baseRef);
        if (baseSnap.exists()) {
          newTasks = baseSnap.data().tasks.map(t => ({
            ...t, completed: false, partiallyCompleted: false, remaining: 0
          }));
        }
    }

    const newDaily = { date: todayStr, tasks: newTasks, penalties: sortedPenalties, lastRun: todayStr };
    await setDoc(doc(db, 'schedules', 'daily'), newDaily);
    setDailyData(newDaily);
  };

  const updateDaily = async (newData) => {
    setDailyData(newData);
    await updateDoc(doc(db, 'schedules', 'daily'), newData);
  };

  const handleTaskUpdate = (updatedTask) => {
    const newTasks = dailyData.tasks.map(t => 
      t.label === updatedTask.label && t.start === updatedTask.start ? updatedTask : t
    );
    updateDaily({ ...dailyData, tasks: newTasks });
  };

  const handlePenaltyUpdate = (updatedPenalty) => {
    const newPenalties = dailyData.penalties.map(p => 
      p.id === updatedPenalty.id ? updatedPenalty : p
    );
    updateDaily({ ...dailyData, penalties: newPenalties });
  };

  const handlePartialCompletion = (task, completedMins) => {
    const remaining = task.duration - completedMins;
    if (remaining <= 0) {
      handleTaskUpdate({ ...task, completed: true });
      return;
    }
    const updatedTask = { ...task, partiallyCompleted: true, remaining: 0, completed: true };
    const newPenalty = {
      id: Math.random().toString(36).substr(2, 9),
      label: task.label,
      duration: remaining,
      completed: false
    };
    const newPenalties = [...dailyData.penalties, newPenalty];
    updateDaily({
      ...dailyData,
      tasks: dailyData.tasks.map(t => t === task ? updatedTask : t),
      penalties: sortPenalties(newPenalties)
    });
  };

  if (loading) return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center text-cyan-500 font-mono tracking-widest">
        <Activity className="animate-spin mb-4" />
        <span className="animate-pulse">BOOTING SYSTEM...</span>
    </div>
  );

  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <div className="min-h-screen bg-background relative selection:bg-cyan-500 selection:text-black">
      {/* Background FX */}
      <div className="bg-grid"></div>
      <div className="scanlines"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-cyan-900/50 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-700 mb-1">
                <span className="w-2 h-2 bg-acid-500 animate-pulse shadow-[0_0_8px_#84cc16]" />
                SYSTEM ONLINE
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                Protocol // <span className="text-cyan-400">{dailyData.date}</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setIsEditorOpen(true)}
            className="group flex items-center gap-3 bg-cyan-950/20 border border-cyan-800 hover:border-cyan-400 hover:bg-cyan-900/40 px-5 py-3 skew-x-[-10deg] transition-all duration-300"
          >
            <div className="skew-x-[10deg] flex items-center gap-2">
                <Settings size={18} className="text-cyan-500 group-hover:rotate-90 transition-transform duration-700" /> 
                <span className="text-xs font-bold text-cyan-100 uppercase tracking-widest">Config</span>
            </div>
          </button>
        </header>

        {/* Dashboard Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Penalties Panel (RED) */}
          <section className="relative">
            <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-crimson-500" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-crimson-500" />
            
            <div className="bg-surface/80 backdrop-blur-sm border border-crimson-900/30 p-6 h-full shadow-[0_0_30px_rgba(239,68,68,0.05)]">
                <h2 className="text-xl font-bold text-crimson-500 mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-crimson-900/30 pb-2">
                    <ShieldAlert className="animate-pulse" size={20} />
                    Critical Debt
                    <span className="ml-auto text-xs font-mono text-crimson-200 bg-crimson-900/50 px-2 py-1">
                      TOTAL: {dailyData.penalties.filter(p=>!p.completed).reduce((acc, curr) => acc + curr.duration, 0)}m
                    </span>
                </h2>
                <PenaltyList 
                    penalties={dailyData.penalties} 
                    onUpdate={handlePenaltyUpdate} 
                />
            </div>
          </section>

          {/* Schedule Panel (BLUE) */}
          <section className="relative">
             <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-500" />
             <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-500" />

            <div className="bg-surface/80 backdrop-blur-sm border border-cyan-900/30 p-6 h-full shadow-[0_0_30px_rgba(34,211,238,0.05)]">
              <div className="flex justify-between items-center mb-6 border-b border-cyan-900/30 pb-2">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-3 uppercase tracking-widest">
                    <Cpu size={20} /> Operations
                </h2>
                {isWeekend && (
                    <span className="text-[10px] font-mono border border-cyan-700 text-cyan-500 px-2 py-0.5 uppercase tracking-widest">
                        Weekend Protocol
                    </span>
                )}
              </div>
              
              <TaskList 
                tasks={dailyData.tasks} 
                onUpdate={handleTaskUpdate}
                onPartial={handlePartialCompletion}
              />
            </div>
          </section>
        </main>

        {isEditorOpen && (
          <ScheduleEditor close={() => setIsEditorOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default App;