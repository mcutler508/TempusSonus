import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ControlSliderProps {
  label: string;
  value: number; // 0 to 1
  onChange: (val: number) => void;
}

const TICK_COUNT = 24;

export const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startX = useRef<number>(0);
  const startVal = useRef<number>(0);

  const progress = Math.max(0, Math.min(1, value));
  const angle = -135 + (progress * 270);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const deltaY = startY.current - clientY;
      const deltaX = clientX - startX.current;
      const delta = deltaY + deltaX;
      const sensitivity = 1 / 200; // full sweep over 200px
      let newValue = startVal.current + delta * sensitivity;
      newValue = Math.max(0, Math.min(1, newValue));
      if (Math.abs(newValue - value) > 0.001) onChange(newValue);
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
  }, [isDragging, value, onChange]);

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

  const arcRadius = 40;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcDash = (progress * 270 / 360) * arcCircumference;

  const pct = Math.round(progress * 100);
  const Icon = progress === 0 ? VolumeX : Volume2;

  return (
    <div className="flex flex-col items-center gap-3 group select-none">
      <div className={`text-micro transition-colors ${isDragging ? 'text-[rgb(var(--accent-glow))]' : 'text-zinc-500 group-hover:text-[rgb(var(--accent-glow))]'}`}>
        {label}
      </div>

      <div
        className="relative flex items-center justify-center w-[88px] h-[88px] rounded-full touch-none cursor-ns-resize"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        title={`Volume: ${pct}%`}
      >
        {/* Drag glow */}
        <div
          className={`absolute -inset-2 rounded-full pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`}
          style={{ boxShadow: '0 0 40px 2px rgb(var(--accent-glow) / 0.4), 0 0 80px 12px rgb(var(--accent-glow) / 0.15)' }}
        />

        {/* Well */}
        <div className="absolute inset-0 rounded-full surface-recessed"></div>

        {/* Ticks */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 88 88">
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const tickAngle = -135 + (i / (TICK_COUNT - 1)) * 270;
            const active = (i / (TICK_COUNT - 1)) <= progress;
            const isMajor = i % 4 === 0;
            const inner = isMajor ? 33 : 35;
            const outer = 40;
            const rad = ((tickAngle - 90) * Math.PI) / 180;
            const x1 = 44 + Math.cos(rad) * inner;
            const y1 = 44 + Math.sin(rad) * inner;
            const x2 = 44 + Math.cos(rad) * outer;
            const y2 = 44 + Math.sin(rad) * outer;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={active ? 'rgb(var(--accent-glow))' : 'currentColor'}
                strokeWidth={isMajor ? 1.4 : 0.8}
                className={active ? '' : 'text-zinc-400/40 dark:text-zinc-400/30'}
                opacity={active ? (isMajor ? 0.95 : 0.7) : (isMajor ? 0.5 : 0.25)}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Value arc */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 88 88">
          <circle
            cx="44" cy="44" r={arcRadius - 5}
            fill="none"
            stroke="rgb(var(--accent-glow))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${arcDash} ${arcCircumference}`}
            transform="rotate(135 44 44)"
            style={{ filter: 'drop-shadow(0 0 4px rgb(var(--accent-glow) / 0.6))' }}
            opacity="0.8"
          />
        </svg>

        {/* Rotating cap */}
        <div
          className="absolute inset-[12px] rounded-full transition-transform duration-75 ease-out"
          style={{
            transform: `rotate(${angle}deg)`,
            background: 'conic-gradient(from 0deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.16) 40%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0.02))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 6px rgba(0,0,0,0.55), 0 6px 18px -4px rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-3.5 rounded-full transition-colors ${isDragging ? 'bg-[rgb(var(--accent-glow))]' : 'bg-zinc-100/90 dark:bg-zinc-200'}`}
            style={{ boxShadow: isDragging ? '0 0 8px rgb(var(--accent-glow))' : '0 0 4px rgba(255,255,255,0.4)' }}
          />
        </div>

        <div className="absolute inset-[12px] rounded-full pointer-events-none bg-gradient-to-b from-white/[0.08] via-transparent to-black/40"></div>

        {/* Center: icon + % */}
        <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none gap-1">
          <Icon size={16} className={`${progress > 0.75 ? 'text-[rgb(var(--accent-glow-soft))]' : 'text-zinc-200'}`} />
          <div className="text-[11px] font-mono text-zinc-300 leading-none">{pct}%</div>
        </div>
      </div>
    </div>
  );
};
