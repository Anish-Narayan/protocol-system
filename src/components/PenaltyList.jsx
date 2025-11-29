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
    <div className="relative p-4 mb-3 bg-crimson-900/10 border border-crimson-500/40 hover:border-crimson-500 hover:shadow-neon-red transition-all duration-300">
      
      {/* Corner Accents */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-crimson-500" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-crimson-500" />

      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <div className="mt-1 text-crimson-500 animate-pulse">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-gray-200 font-bold uppercase tracking-wider text-sm">{penalty.label}</h3>
            <p className="text-lg font-mono text-crimson-500 mt-1 font-bold">
               -{formatDuration(penalty.duration)}
            </p>
          </div>
        </div>

        <button
          onClick={() => onUpdate({ ...penalty, completed: true })}
          className="text-crimson-800 hover:text-acid-500 transition-colors"
          title="Resolve Full Penalty"
        >
          <div className="border border-crimson-900 p-1 hover:border-acid-500">
             <AlertTriangle size={18} />
          </div>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-crimson-900/30 pt-2">
        {!isInputVisible ? (
          <button
            onClick={() => setIsInputVisible(true)}
            className="text-xs text-crimson-500/70 hover:text-crimson-400 uppercase tracking-widest transition"
          >
            [ Reduce Load ]
          </button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <input
              type="number"
              placeholder="00"
              className="w-full bg-black border border-crimson-600 rounded-none px-2 py-1 text-xs text-white focus:border-crimson-400 outline-none font-mono"
              value={partialInput}
              onChange={(e) => setPartialInput(e.target.value)}
              autoFocus
            />
            <button
              onClick={handlePartialDeduction}
              className="text-xs bg-crimson-900 hover:bg-crimson-600 text-white px-3 py-1 uppercase font-mono"
            >
              OK
            </button>
            <button
              onClick={() => setIsInputVisible(false)}
              className="text-crimson-500 hover:text-white"
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
      <div className="flex flex-col items-center justify-center h-32 text-crimson-900/50 border border-dashed border-crimson-900/30">
        <span className="font-mono text-sm tracking-widest">STATUS: CLEAR</span>
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