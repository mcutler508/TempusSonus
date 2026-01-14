import React from 'react';

interface ControlDialProps {
  label: string;
  value: string | number;
  onIncrease: () => void;
  onDecrease: () => void;
  subValue?: string;
}

export const ControlDial: React.FC<ControlDialProps> = ({ label, value, onIncrease, onDecrease, subValue }) => {
  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-500/80 transition-colors">
        {label}
      </div>
      
      <div className="relative flex items-center justify-center w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {/* Interactive Areas */}
        <button 
          onClick={onDecrease}
          className="absolute left-0 h-full w-1/2 rounded-l-full cursor-w-resize active:bg-black/5 dark:active:bg-white/5 outline-none z-10"
          aria-label={`Decrease ${label}`}
        />
        <button 
          onClick={onIncrease}
          className="absolute right-0 h-full w-1/2 rounded-r-full cursor-e-resize active:bg-black/5 dark:active:bg-white/5 outline-none z-10"
          aria-label={`Increase ${label}`}
        />

        {/* Display Value */}
        <div className="text-center z-0 pointer-events-none">
          <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 font-mono tracking-tighter">
            {value}
          </div>
          {subValue && (
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase">
              {subValue}
            </div>
          )}
        </div>
        
        {/* Decorative Ring */}
        <div className="absolute inset-0 rounded-full border border-zinc-300/30 dark:border-zinc-700/30"></div>
        <div className="absolute inset-1 rounded-full border border-zinc-200 dark:border-zinc-800/50"></div>
      </div>
    </div>
  );
};