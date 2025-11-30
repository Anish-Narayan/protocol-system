import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getTodayString, sortPenalties } from './utils/time';
import TaskList from './components/TaskList';
import PenaltyList from './components/PenaltyList';
import ScheduleEditor from './components/ScheduleEditor';
import Login from './components/Login';
import { Settings, Cpu, ShieldAlert, Activity, Pyramid, LogOut, Sun } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [dailyData, setDailyData] = useState({ tasks: [], penalties: [], date: '' });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'scifi');

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false); // Stop loading if no user
    });
    return () => unsubscribe();
  }, []);

  // 2. Theme Engine
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'scifi' ? 'egypt' : 'scifi');
  const handleLogout = () => signOut(auth);

  // 3. User Data Logic (Only runs if user exists)
  useEffect(() => {
    if (!user) return;

    const initSystem = async () => {
      setLoading(true);
      const today = getTodayString();
      // PATH CHANGE: users/{uid}/schedules/daily
      const dailyRef = doc(db, 'users', user.uid, 'schedules', 'daily');
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
        // Force refresh to trigger rollover logic
        initSystem();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user, dailyData.date]); // Re-run if user changes or date changes

  const performRollover = async (todayStr, previousDailyData) => {
    console.log("INITIALIZING USER ROLLOVER...");
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
        // PATH CHANGE: users/{uid}/schedules/base
        const baseRef = doc(db, 'users', user.uid, 'schedules', 'base');
        const baseSnap = await getDoc(baseRef);
        if (baseSnap.exists()) {
          newTasks = baseSnap.data().tasks.map(t => ({
            ...t, completed: false, partiallyCompleted: false, remaining: 0
          }));
        }
    }

    const newDaily = { date: todayStr, tasks: newTasks, penalties: sortedPenalties, lastRun: todayStr };
    // PATH CHANGE
    await setDoc(doc(db, 'users', user.uid, 'schedules', 'daily'), newDaily);
    setDailyData(newDaily);
  };

  const updateDaily = async (newData) => {
    setDailyData(newData);
    // PATH CHANGE
    await updateDoc(doc(db, 'users', user.uid, 'schedules', 'daily'), newData);
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
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center text-primary-text font-mono tracking-widest">
        <Activity className="animate-spin mb-4" />
        <span className="animate-pulse">BOOTING SYSTEM...</span>
    </div>
  );

  // If no user, show login
  if (!user) return <Login />;

  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

  return (
    <div className="min-h-screen bg-background relative transition-colors duration-500">
      <div className="bg-grid"></div>
      <div className="scanlines"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-primary-dim pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary-text mb-1 opacity-80">
                <span className="w-2 h-2 bg-text-main animate-pulse" />
                USER: {user.email.split('@')[0].toUpperCase()}
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-text-main uppercase drop-shadow-md">
                {theme === 'scifi' ? 'PROTOCOL //' : 'THE DYNASTY'} <span className="text-primary-text">{dailyData.date}</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            <button onClick={toggleTheme} className="p-3 border border-theme border-primary text-primary-text hover:bg-primary-dim transition-all rounded-theme">
                {theme === 'scifi' ? <Pyramid size={20} /> : <Cpu size={20} />}
            </button>

            <button onClick={() => setIsEditorOpen(true)} className="flex items-center gap-2 px-5 py-3 border border-theme border-primary text-primary-text hover:bg-primary-dim transition-all rounded-theme uppercase font-bold text-xs tracking-widest">
                <Settings size={18} /> Config
            </button>

            <button onClick={handleLogout} className="p-3 border border-theme border-danger text-danger hover:bg-danger hover:text-white transition-all rounded-theme">
                <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PENALTIES */}
          <section className="relative">
            <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-danger" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-danger" />
            <div className="bg-surface/80 backdrop-blur-md border border-theme border-danger-dim p-6 h-full shadow-lg">
                <h2 className="text-xl font-bold text-danger mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-danger-dim pb-2">
                    <ShieldAlert size={20} />
                    {theme === 'scifi' ? 'CRITICAL DEBT' : 'CURSED TIME'}
                    <span className="ml-auto text-xs font-mono text-danger bg-danger-dim px-2 py-1">
                      {dailyData.penalties.filter(p=>!p.completed).reduce((acc, curr) => acc + curr.duration, 0)}m
                    </span>
                </h2>
                <PenaltyList penalties={dailyData.penalties} onUpdate={handlePenaltyUpdate} />
            </div>
          </section>

          {/* SCHEDULE */}
          <section className="relative">
             <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-primary" />
             <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-primary" />
            <div className="bg-surface/80 backdrop-blur-md border border-theme border-primary-dim p-6 h-full shadow-lg">
              <div className="flex justify-between items-center mb-6 border-b border-primary-dim pb-2">
                <h2 className="text-xl font-bold text-primary-text flex items-center gap-3 uppercase tracking-widest">
                    {theme === 'scifi' ? <Cpu size={20} /> : <Sun size={20} />}
                    {theme === 'scifi' ? 'OPERATIONS' : 'ROYAL DUTIES'}
                </h2>
                {isWeekend && (
                    <span className="text-[10px] font-mono border border-primary text-primary-text px-2 py-0.5 uppercase">Weekend</span>
                )}
              </div>
              <TaskList tasks={dailyData.tasks} onUpdate={handleTaskUpdate} onPartial={handlePartialCompletion} />
            </div>
          </section>
        </main>

        {isEditorOpen && <ScheduleEditor user={user} close={() => setIsEditorOpen(false)} />}
      </div>
    </div>
  );
};

export default App;