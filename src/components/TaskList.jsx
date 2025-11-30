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
      "relative p-4 mb-3 border-l-4 transition-all duration-300 group overflow-hidden border-theme rounded-theme",
      isCompleted 
        ? "bg-primary-dim/20 border-primary-dim text-text-muted opacity-60" 
        : "bg-surface border-primary hover:shadow-lg hover:translate-x-1"
    )}>
      
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1">
          <h3 className={clsx(
            "font-bold text-lg tracking-wide uppercase transition-colors",
            isCompleted ? "line-through decoration-primary-dim" : "text-text-main group-hover:text-primary-text"
          )}>
            {task.label}
          </h3>
          <p className="text-sm font-mono text-primary-text mt-1 opacity-80">
            {task.start} &rarr; {task.end}
          </p>
        </div>
        
        <button 
          onClick={() => onUpdate({ ...task, completed: true })}
          className={clsx(
            "w-8 h-8 flex items-center justify-center border border-theme transition-all duration-200 ml-3 rounded-theme",
            isCompleted 
              ? "border-primary-dim text-primary-dim"
              : "border-primary text-transparent hover:bg-primary hover:text-surface"
          )}
        >
          <Check size={18} strokeWidth={4} />
        </button>
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-primary-dim">
        <span className="text-xs font-mono text-text-muted">
          DUR: {formatDuration(task.duration)}
        </span>
        
        {!isCompleted && (
            !showPartial ? (
            <button 
                onClick={() => setShowPartial(true)}
                className="text-xs font-mono text-primary-text hover:underline uppercase tracking-widest transition-colors"
            >
                [ Partial ]
            </button>
            ) : (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <input 
                type="number" 
                placeholder="00"
                className="w-12 bg-background border border-primary text-primary-text px-1 py-0.5 text-xs font-mono focus:outline-none text-center"
                value={partialInput}
                onChange={(e) => setPartialInput(e.target.value)}
                autoFocus
                />
                <button 
                onClick={handlePartialSubmit}
                className="text-xs bg-primary text-surface px-2 py-0.5 font-mono uppercase font-bold"
                >
                OK
                </button>
                <button onClick={() => setShowPartial(false)} className="text-text-muted hover:text-text-main"><Activity size={12}/></button>
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
      {tasks.length === 0 && <p className="text-text-muted italic font-mono text-sm text-center py-4">SILENCE</p>}
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