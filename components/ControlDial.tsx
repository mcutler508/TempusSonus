import React from 'react';

interface ControlDialProps {
  label: string;
  value: string | number;
  onIncrease: () => void;
  onDecrease: () => void;
  subValue?: string;
}

// 24 tick marks around the perimeter
const TICK_COUNT = 24;

export const ControlDial: React.FC<ControlDialProps> = ({ label, value, onIncrease, onDecrease, subValue }) => {
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="text-micro text-zinc-500 dark:text-zinc-500 group-hover:text-[rgb(var(--accent-glow))] transition-colors">
        {label}
      </div>

      <div className="relative flex items-center justify-center w-[88px] h-[88px] rounded-full select-none">
        {/* Recessed well behind cap */}
        <div className="absolute inset-0 rounded-full surface-recessed"></div>

        {/* Perimeter ticks */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 88 88">
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const angle = (i / TICK_COUNT) * 360 - 90;
            const isMajor = i % 6 === 0;
            const inner = isMajor ? 34 : 36;
            const outer = 40;
            const rad = (angle * Math.PI) / 180;
            const x1 = 44 + Math.cos(rad) * inner;
            const y1 = 44 + Math.sin(rad) * inner;
            const x2 = 44 + Math.cos(rad) * outer;
            const y2 = 44 + Math.sin(rad) * outer;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="currentColor"
                strokeWidth={isMajor ? 1.2 : 0.7}
                className={`text-zinc-500/70 dark:text-zinc-400/50 ${isMajor ? 'opacity-70' : 'opacity-30'}`}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Brushed cap */}
        <div
          className="absolute inset-[10px] rounded-full transition-transform duration-150"
          style={{
            background: 'conic-gradient(from 0deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.14) 40%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.14) 80%, rgba(255,255,255,0.02))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 6px rgba(0,0,0,0.5), 0 4px 14px -4px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />

        {/* Cap inner shading overlay for depth */}
        <div className="absolute inset-[10px] rounded-full pointer-events-none bg-gradient-to-b from-white/[0.08] via-transparent to-black/40"></div>

        {/* Hit zones */}
        <button
          onClick={onDecrease}
          className="absolute left-0 h-full w-1/2 rounded-l-full cursor-w-resize outline-none z-10 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-glow))] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={`Decrease ${label}`}
        />
        <button
          onClick={onIncrease}
          className="absolute right-0 h-full w-1/2 rounded-r-full cursor-e-resize outline-none z-10 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-glow))] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={`Increase ${label}`}
        />

        {/* Display */}
        <div className="relative z-20 text-center pointer-events-none px-1">
          <div className="font-display italic text-[26px] leading-none text-zinc-900 dark:text-zinc-50">
            {value}
          </div>
          {subValue && (
            <div className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1.5 uppercase tracking-[0.18em] font-mono">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
