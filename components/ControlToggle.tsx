import React from 'react';

interface ControlToggleProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
}

export const ControlToggle: React.FC<ControlToggleProps> = ({ label, isChecked, onToggle }) => {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onToggle}>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-500/80 transition-colors">
        {label}
      </div>
      
      <div className={`
        relative flex items-center w-24 h-12 rounded-full border transition-all duration-300
        ${isChecked 
          ? 'bg-zinc-100 dark:bg-zinc-900 border-amber-500/50 dark:border-amber-900/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
          : 'bg-zinc-200 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800'
        }
      `}>
        {/* Toggle Track Background */}
        <div className="absolute inset-x-2 h-1 bg-zinc-300 dark:bg-zinc-800 rounded-full overflow-hidden">
           <div className={`h-full bg-amber-500 dark:bg-amber-600 transition-all duration-300 ${isChecked ? 'w-full' : 'w-0'}`} />
        </div>

        {/* The Knob */}
        <div className={`
          absolute w-8 h-8 rounded-full shadow-lg transform transition-transform duration-300 ease-out flex items-center justify-center
          ${isChecked ? 'translate-x-14 bg-amber-500 text-white dark:text-zinc-900' : 'translate-x-2 bg-white dark:bg-zinc-200 text-zinc-400 dark:text-zinc-500'}
        `}>
           <div className={`w-2 h-2 rounded-full ${isChecked ? 'bg-white' : 'bg-zinc-400'}`} />
        </div>
        
        {/* State Label */}
        <div className={`absolute w-full text-center text-[10px] font-mono font-bold pointer-events-none transition-opacity duration-300 ${isChecked ? 'opacity-100 text-amber-600 dark:text-amber-500' : 'opacity-0'}`} style={{ transform: 'translateY(20px)' }}>
          ON
        </div>
        <div className={`absolute w-full text-center text-[10px] font-mono font-bold pointer-events-none transition-opacity duration-300 ${!isChecked ? 'opacity-100 text-zinc-500 dark:text-zinc-600' : 'opacity-0'}`} style={{ transform: 'translateY(20px)' }}>
          OFF
        </div>
      </div>
    </div>
  );
};