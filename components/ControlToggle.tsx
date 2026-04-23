import React from 'react';

interface ControlToggleProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
}

export const ControlToggle: React.FC<ControlToggleProps> = ({ label, isChecked, onToggle }) => {
  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer select-none" onClick={onToggle}>
      {label && (
        <div className="text-micro text-zinc-500 group-hover:text-[rgb(var(--accent-glow))] transition-colors">
          {label}
        </div>
      )}

      <div
        className={`
          relative flex items-center w-[88px] h-[44px] rounded-full transition-all duration-300
          ${isChecked ? 'surface-glass' : 'surface-recessed'}
        `}
        role="switch"
        aria-checked={isChecked}
      >
        {/* Track fill — only visible when on */}
        <div
          className={`absolute inset-x-2 top-1/2 -translate-y-1/2 h-[3px] rounded-full overflow-hidden transition-opacity duration-300 ${isChecked ? 'opacity-100' : 'opacity-30'}`}
          style={{ background: 'rgb(var(--surface-tint-dark) / 0.08)' }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: isChecked ? '100%' : '0%',
              background: 'linear-gradient(90deg, rgb(var(--accent-glow) / 0.6), rgb(var(--accent-glow)))',
              boxShadow: isChecked ? '0 0 8px rgb(var(--accent-glow))' : 'none',
            }}
          />
        </div>

        {/* Knob */}
        <div
          className={`
            absolute w-8 h-8 rounded-full transform transition-all duration-300 ease-out
            flex items-center justify-center
            ${isChecked ? 'translate-x-[52px]' : 'translate-x-[4px]'}
          `}
          style={{
            background: isChecked
              ? 'radial-gradient(circle at 30% 30%, rgb(var(--accent-glow-soft)), rgb(var(--accent-glow)) 60%, rgb(var(--accent-glow) / 0.85))'
              : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(200,200,210,0.15) 70%, rgba(150,150,160,0.08))',
            boxShadow: isChecked
              ? '0 0 14px rgb(var(--accent-glow) / 0.6), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
              : '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${isChecked ? 'bg-white/80' : 'bg-zinc-500/50'}`}
          />
        </div>
      </div>
    </div>
  );
};
