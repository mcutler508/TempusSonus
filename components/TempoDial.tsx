import React, { useState, useEffect, useRef } from 'react';

interface TempoDialProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  subValue?: string;
  isPending?: boolean;
}

export const TempoDial: React.FC<TempoDialProps> = ({ 
  label, 
  value, 
  min = 40, 
  max = 240, 
  onChange,
  subValue,
  isPending = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startX = useRef<number>(0);
  const startVal = useRef<number>(0);
  const dialRef = useRef<HTMLDivElement>(null);

  // Rotation logic
  // Map value (min-max) to angle (-135 to 135)
  const range = max - min;
  const progress = (value - min) / range;
  const angle = -135 + (progress * 270);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      // Support both X and Y dragging
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      
      const deltaY = startY.current - clientY; // Up is positive (increase)
      const deltaX = clientX - startX.current; // Right is positive (increase)
      
      // Combine deltas: Dragging up or right increases value
      const delta = deltaY + deltaX;
      
      // Sensitivity: 1 BPM per 2 pixels
      const sensitivity = 0.5; 
      
      let newValue = startVal.current + Math.round(delta * sensitivity);
      newValue = Math.max(min, Math.min(max, newValue));
      
      if (newValue !== value) {
        onChange(newValue);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, value, min, max, onChange]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    
    startY.current = clientY;
    startX.current = clientX;
    startVal.current = value;
    
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="flex flex-col items-center gap-2 group select-none">
      <div className={`text-[10px] uppercase tracking-widest font-semibold transition-colors ${isDragging ? 'text-amber-500' : 'text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-500/80'}`}>
        {label}
      </div>
      
      <div 
        ref={dialRef}
        className="relative flex items-center justify-center w-24 h-24 rounded-full touch-none cursor-ns-resize"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        title="Drag up/down or left/right to change BPM"
      >
        {/* Outer Bezel / Glow Container */}
        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isDragging ? 'bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : ''}`}></div>

        {/* The Base */}
        <div className="absolute inset-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"></div>

        {/* Range Indicator Ring (Background) */}
        <svg className="absolute inset-0 w-full h-full p-2 pointer-events-none opacity-10 dark:opacity-20">
            <circle
                cx="50%" cy="50%" r="44%"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray="75 25" pathLength="100"
                transform="rotate(135 48 48)"
                className="text-zinc-600"
            />
        </svg>

        {/* The Rotating Cap */}
        <div 
           className="absolute inset-2 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-300 dark:border-zinc-700/50 transition-transform duration-75 ease-out shadow-lg"
           style={{ transform: `rotate(${angle}deg)` }}
        >
           {/* Marker */}
           <div className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-4 rounded-full transition-colors ${isDragging ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-zinc-400 dark:bg-zinc-500'}`}></div>
        </div>

        {/* Center Display */}
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className={`text-3xl font-bold font-mono tracking-tighter transition-colors ${
            isPending ? 'animate-[pulse_0.5s_infinite] text-amber-500/50 dark:text-amber-500/50' : 
            isDragging ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-800 dark:text-zinc-200'
          }`}>
            {value}
          </div>
          {subValue && (
            <div className="text-[9px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-wider">{subValue}</div>
          )}
        </div>
      </div>
    </div>
  );
};