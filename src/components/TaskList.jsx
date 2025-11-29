import React, { useState } from 'react';
import { formatDuration } from '../utils/time';
import { Check, Activity } from 'lucide-react';
import clsx from 'clsx';

const TaskItem = ({ task, onUpdate, onPartial }) => {
  const [partialInput, setPartialInput] = useState('');
  const [showPartial, setShowPartial] = useState(false);

  const handlePartialSubmit = () => {
    const mins = parseInt(partialInput);
    if (!isNaN(mins) && mins > 0) {
      onPartial(task, mins);
      setShowPartial(false);
    }
  };

  const isCompleted = task.completed;

  return (
    <div className={clsx(
      "relative p-4 mb-3 border-l-2 transition-all duration-300 group overflow-hidden",
      isCompleted 
        ? "bg-cyan-950/10 border-cyan-900 border-t border-b border-r opacity-50 grayscale" 
        : "bg-surface border border-cyan-900/30 hover:shadow-neon-blue hover:translate-x-1"
    )}>
      
      {/* Connector Line Animation */}
      {!isCompleted && (
        <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="flex justify-between items-start mb-1">
        <div className="flex-1">
          <h3 className={clsx(
            "font-bold text-lg tracking-wide uppercase transition-colors",
            isCompleted ? "text-cyan-800 line-through" : "text-gray-100 group-hover:text-cyan-400"
          )}>
            {task.label}
          </h3>
          <p className="text-sm font-mono text-cyan-700 mt-1">
            <span className="text-cyan-900 mr-2">START:</span>{task.start} &rarr; {task.end}
          </p>
        </div>
        
        <button 
          onClick={() => onUpdate({ ...task, completed: true })}
          className={clsx(
            "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border transition-all duration-200 ml-3",
            isCompleted 
              ? "border-cyan-900 text-cyan-900"
              : "border-cyan-500 text-transparent hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_rgba(34,211,238,0.6)]"
          )}
        >
          <Check size={18} strokeWidth={4} />
        </button>
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-gray-800">
        <span className="text-xs font-mono text-gray-500 bg-black px-1 border border-gray-800">
          DUR: {formatDuration(task.duration)}
        </span>
        
        {!isCompleted && (
            !showPartial ? (
            <button 
                onClick={() => setShowPartial(true)}
                className="text-xs font-mono text-cyan-600 hover:text-cyan-300 uppercase tracking-widest transition-colors"
            >
                [ Partial ]
            </button>
            ) : (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <input 
                type="number" 
                placeholder="00"
                className="w-12 bg-black border border-cyan-600 text-cyan-400 px-1 py-0.5 text-xs font-mono focus:outline-none text-center"
                value={partialInput}
                onChange={(e) => setPartialInput(e.target.value)}
                autoFocus
                />
                <button 
                onClick={handlePartialSubmit}
                className="text-xs bg-cyan-900 border border-cyan-600 text-cyan-100 hover:bg-cyan-500 hover:text-black px-2 py-0.5 font-mono uppercase"
                >
                SET
                </button>
                <button onClick={() => setShowPartial(false)} className="text-gray-600 hover:text-white"><Activity size={12}/></button>
            </div>
            )
        )}
      </div>
    </div>
  );
};

const TaskList = ({ tasks, onUpdate, onPartial }) => {
  return (
    <div className="space-y-2">
      {tasks.length === 0 && <p className="text-gray-600 italic font-mono text-sm text-center py-4">NO ACTIVE DIRECTIVES</p>}
      {tasks.map((task, idx) => (
        <TaskItem 
          key={`${task.label}-${task.start}-${idx}`} 
          task={task} 
          onUpdate={onUpdate}
          onPartial={onPartial}
        />
      ))}
    </div>
  );
};

export default TaskList;