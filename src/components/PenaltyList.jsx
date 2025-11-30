import React, { useState } from 'react';
import { formatDuration } from '../utils/time';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

const PenaltyItem = ({ penalty, onUpdate }) => {
  const [partialInput, setPartialInput] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);

  const handlePartialDeduction = () => {
    const mins = parseInt(partialInput);
    if (!isNaN(mins) && mins > 0) {
      const newDuration = penalty.duration - mins;
      if (newDuration <= 0) {
        onUpdate({ ...penalty, duration: 0, completed: true });
      } else {
        onUpdate({ ...penalty, duration: newDuration });
      }
      setIsInputVisible(false);
      setPartialInput('');
    }
  };

  if (penalty.completed) return null;

  return (
    <div className="relative p-4 mb-3 bg-danger-dim/10 border border-theme border-danger-dim hover:border-danger transition-all duration-300 rounded-theme">
      
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-danger animate-pulse">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-text-main font-bold uppercase tracking-wider text-sm">{penalty.label}</h3>
            <p className="text-lg font-mono text-danger mt-1 font-bold">
               -{formatDuration(penalty.duration)}
            </p>
          </div>
        </div>

        <button
          onClick={() => onUpdate({ ...penalty, completed: true })}
          className="text-danger hover:text-text-main transition-colors"
        >
          <div className="border border-danger p-1 rounded-theme">
             <AlertTriangle size={18} />
          </div>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-danger-dim pt-2">
        {!isInputVisible ? (
          <button
            onClick={() => setIsInputVisible(true)}
            className="text-xs text-danger hover:underline uppercase tracking-widest transition"
          >
            [ Reduce ]
          </button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <input
              type="number"
              placeholder="00"
              className="w-full bg-background border border-danger px-2 py-1 text-xs text-text-main outline-none font-mono"
              value={partialInput}
              onChange={(e) => setPartialInput(e.target.value)}
              autoFocus
            />
            <button
              onClick={handlePartialDeduction}
              className="text-xs bg-danger text-surface px-3 py-1 uppercase font-mono font-bold"
            >
              OK
            </button>
            <button
              onClick={() => setIsInputVisible(false)}
              className="text-danger hover:text-text-main"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PenaltyList = ({ penalties, onUpdate }) => {
  const activePenalties = penalties.filter(p => !p.completed);

  if (activePenalties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-text-muted border border-dashed border-danger-dim rounded-theme">
        <span className="font-mono text-sm tracking-widest">CLEARED</span>
      </div>
    );
  }

  return (
    <div>
      {penalties.map((penalty) => (
        <PenaltyItem key={penalty.id} penalty={penalty} onUpdate={onUpdate} />
      ))}
    </div>
  );
};

export default PenaltyList;