import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ControlSliderProps {
  label: string;
  value: number; // 0 to 1
  onChange: (val: number) => void;
}

export const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col items-center gap-2 group w-full">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-500/80 transition-colors">
        {label}
      </div>
      
      <div className="relative flex flex-col items-center justify-center w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Icon based on volume level */}
        <div className="mb-2 text-zinc-400 dark:text-zinc-500">
           {value === 0 ? <VolumeX size={14} /> : <Volume2 size={14} className={value > 0.7 ? "text-amber-600 dark:text-amber-500" : ""} />}
        </div>

        {/* Custom Range Track Container */}
        <div className="relative w-16 h-1 bg-zinc-300 dark:bg-zinc-700/50 rounded-full">
           {/* Fill */}
           <div 
             className="absolute top-0 left-0 h-full bg-amber-500 rounded-full" 
             style={{ width: `${value * 100}%` }}
           />
           {/* Thumb (Visual Only, Input handles interaction) */}
           <div 
             className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border border-zinc-200 dark:border-none"
             style={{ left: `${value * 100}%`, marginLeft: `-${value * 12}px` }} 
           />
        </div>

        {/* The Actual Input */}
        <input 
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-amber-500"
          title={`Volume: ${Math.round(value * 100)}%`}
        />
        
        {/* Value Label */}
        <div className="mt-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          {Math.round(value * 100)}%
        </div>
      </div>
    </div>
  );
};