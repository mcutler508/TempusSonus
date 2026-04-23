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

const TICK_COUNT = 36;

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

  const range = max - min;
  const progress = (value - min) / range;
  const angle = -135 + (progress * 270);
  const arcLength = progress * 270; // in degrees, for the live value arc

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const deltaY = startY.current - clientY;
      const deltaX = clientX - startX.current;
      const delta = deltaY + deltaX;
      const sensitivity = 0.5;
      let newValue = startVal.current + Math.round(delta * sensitivity);
      newValue = Math.max(min, Math.min(max, newValue));
      if (newValue !== value) onChange(newValue);
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

  // SVG arc math: radius 40, arc spans -135deg to -135+arcLength deg
  const arcRadius = 40;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcVisible = (270 / 360) * arcCircumference;   // max track length
  const arcDash = (arcLength / 360) * arcCircumference;

  return (
    <div className="flex flex-col items-center gap-3 group select-none">
      <div className={`text-micro transition-colors ${isDragging ? 'text-[rgb(var(--accent-glow))]' : 'text-zinc-500 group-hover:text-[rgb(var(--accent-glow))]'}`}>
        {label}
      </div>

      <div
        ref={dialRef}
        className="relative flex items-center justify-center w-[88px] h-[88px] rounded-full touch-none cursor-ns-resize"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        title="Drag up/down or left/right to change BPM"
      >
        {/* Drag glow halo */}
        <div
          className={`absolute -inset-2 rounded-full pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`}
          style={{ boxShadow: '0 0 40px 2px rgb(var(--accent-glow) / 0.4), 0 0 80px 12px rgb(var(--accent-glow) / 0.15)' }}
        />

        {/* Recessed well */}
        <div className="absolute inset-0 rounded-full surface-recessed"></div>

        {/* Perimeter ticks */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 88 88">
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const tickAngle = -135 + (i / (TICK_COUNT - 1)) * 270;
            const isMajor = i % 6 === 0;
            const active = (i / (TICK_COUNT - 1)) <= progress;
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
                opacity={active ? (isMajor ? 0.95 : 0.75) : (isMajor ? 0.5 : 0.25)}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Live value arc */}
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

        {/* Brushed rotating cap */}
        <div
          className="absolute inset-[12px] rounded-full transition-transform duration-75 ease-out"
          style={{
            transform: `rotate(${angle}deg)`,
            background: 'conic-gradient(from 0deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.16) 40%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0.02))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 6px rgba(0,0,0,0.55), 0 6px 18px -4px rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Indicator marker */}
          <div
            className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-3.5 rounded-full transition-colors ${isDragging ? 'bg-[rgb(var(--accent-glow))]' : 'bg-zinc-100/90 dark:bg-zinc-200'}`}
            style={{ boxShadow: isDragging ? '0 0 8px rgb(var(--accent-glow))' : '0 0 4px rgba(255,255,255,0.4)' }}
          />
        </div>

        {/* Cap shading overlay */}
        <div className="absolute inset-[12px] rounded-full pointer-events-none bg-gradient-to-b from-white/[0.08] via-transparent to-black/40"></div>

        {/* Center display */}
        <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none">
          <div
            className={`font-display italic text-[30px] leading-none transition-colors ${
              isPending ? 'animate-[pulse_0.5s_infinite] text-[rgb(var(--accent-glow))] opacity-60' :
              isDragging ? 'text-[rgb(var(--accent-glow))]' : 'text-zinc-900 dark:text-zinc-50'
            }`}
          >
            {value}
          </div>
          {subValue && (
            <div className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1.5 font-mono uppercase tracking-[0.18em]">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
