import React from 'react';
import { X, Moon, Sun, Check, Eye, Monitor, Sparkles } from 'lucide-react';
import { Theme } from '../types';
import { ControlToggle } from './ControlToggle';

interface SettingsViewProps {
  currentTheme: Theme;
  showBackgroundVisuals: boolean;
  showVisualPanel: boolean;
  visualIntensity: number;
  onSetTheme: (theme: Theme) => void;
  onToggleVisuals: () => void;
  onToggleVisualPanel: () => void;
  onSetVisualIntensity: (v: number) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  showBackgroundVisuals,
  showVisualPanel,
  visualIntensity,
  onSetTheme,
  onToggleVisuals,
  onToggleVisualPanel,
  onSetVisualIntensity,
  onClose
}) => {
  const intensityPct = Math.round(visualIntensity * 100);
  return (
    <div className="w-full max-w-2xl mx-auto surface-glass rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
      >
        <X size={22} />
      </button>

      <div className="flex items-baseline gap-3 mb-8">
        <div className="text-micro text-zinc-500 dark:text-zinc-400">Console</div>
        <h2 className="font-display italic text-[40px] leading-none text-zinc-900 dark:text-zinc-50">Settings</h2>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-micro text-zinc-500 dark:text-zinc-400 mb-4">Appearance</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => onSetTheme('dark')}
              className={`relative flex items-center gap-4 p-4 rounded-xl text-left transition-all ring-1 ${
                currentTheme === 'dark'
                  ? 'ring-[rgb(var(--accent-glow)/0.5)] bg-[rgb(var(--accent-glow)/0.1)] text-zinc-900 dark:text-white'
                  : 'ring-zinc-300/40 dark:ring-white/10 bg-white/5 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-400 hover:ring-zinc-400/50 dark:hover:ring-white/20'
              }`}
            >
              <div className={`p-2 rounded-full ${currentTheme === 'dark' ? 'bg-[rgb(var(--accent-glow)/0.2)] text-[rgb(var(--accent-glow))]' : 'bg-zinc-200/60 dark:bg-white/5'}`}>
                <Moon size={18} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">TempusSonus Dark</div>
                <div className="text-xs opacity-70">The original console.</div>
              </div>
              {currentTheme === 'dark' && <Check size={16} className="absolute top-3 right-3 text-[rgb(var(--accent-glow))]" />}
            </button>

            <button
              onClick={() => onSetTheme('light')}
              className={`relative flex items-center gap-4 p-4 rounded-xl text-left transition-all ring-1 ${
                currentTheme === 'light'
                  ? 'ring-[rgb(var(--accent-glow)/0.5)] bg-[rgb(var(--accent-glow)/0.1)] text-zinc-900 dark:text-white'
                  : 'ring-zinc-300/40 dark:ring-white/10 bg-white/5 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-400 hover:ring-zinc-400/50 dark:hover:ring-white/20'
              }`}
            >
              <div className={`p-2 rounded-full ${currentTheme === 'light' ? 'bg-[rgb(var(--accent-glow)/0.2)] text-[rgb(var(--accent-glow))]' : 'bg-zinc-200/60 dark:bg-white/5'}`}>
                <Sun size={18} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Studio Light</div>
                <div className="text-xs opacity-70">High contrast paper.</div>
              </div>
              {currentTheme === 'light' && <Check size={16} className="absolute top-3 right-3 text-[rgb(var(--accent-glow))]" />}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 dark:bg-white/[0.02] ring-1 ring-zinc-300/30 dark:ring-white/10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-200/60 dark:bg-white/5 rounded-full text-zinc-600 dark:text-zinc-400">
                  <Monitor size={18} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Liquid Field</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-500">Full-bleed WebGL background behind the console.</div>
                </div>
              </div>
              <ControlToggle label="" isChecked={showBackgroundVisuals} onToggle={onToggleVisuals} />
            </div>

            {/* Visual intensity slider */}
            <div className={`p-4 rounded-xl bg-white/5 dark:bg-white/[0.02] ring-1 ring-zinc-300/30 dark:ring-white/10 transition-opacity ${showBackgroundVisuals ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-zinc-200/60 dark:bg-white/5 rounded-full text-zinc-600 dark:text-zinc-400">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Visual Intensity</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-500">How present the liquid field feels behind the console.</div>
                </div>
                <div className="font-mono text-xs text-zinc-700 dark:text-zinc-300 tabular-nums w-10 text-right">
                  {intensityPct}%
                </div>
              </div>

              <div className="relative h-1.5 rounded-full bg-zinc-300/40 dark:bg-white/10 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${intensityPct}%`,
                    background: 'linear-gradient(90deg, rgb(var(--accent-glow) / 0.6), rgb(var(--accent-glow)))',
                    boxShadow: '0 0 10px rgb(var(--accent-glow) / 0.6)',
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={visualIntensity}
                  onChange={(e) => onSetVisualIntensity(parseFloat(e.target.value))}
                  aria-label="Visual intensity"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between mt-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                <span>Off</span>
                <span>Ambient</span>
                <span>Max</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 dark:bg-white/[0.02] ring-1 ring-zinc-300/30 dark:ring-white/10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-200/60 dark:bg-white/5 rounded-full text-zinc-600 dark:text-zinc-400">
                  <Eye size={18} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Pulse Panel</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-500">Legacy visualizer panel below the grid.</div>
                </div>
              </div>
              <ControlToggle label="" isChecked={showVisualPanel} onToggle={onToggleVisualPanel} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-micro text-zinc-500 dark:text-zinc-400 mb-4">About</h3>
          <div className="p-4 rounded-xl bg-white/5 dark:bg-white/[0.02] ring-1 ring-zinc-300/30 dark:ring-white/10 text-sm text-zinc-700 dark:text-zinc-400">
            <p className="mb-2"><span className="font-display italic text-zinc-900 dark:text-zinc-100 text-lg">TempusSonus.ai</span> <span className="font-mono text-xs text-zinc-500 ml-1">v1.4</span></p>
            <p>Designed for professional rhythm training. Optimized for desktop use.</p>
          </div>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-300/30 dark:border-white/10 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg font-semibold text-black transition-transform hover:scale-[1.02]"
          style={{
            background: 'radial-gradient(circle at 30% 25%, rgb(var(--accent-glow-soft)), rgb(var(--accent-glow)) 60%)',
            boxShadow: '0 4px 14px -2px rgb(var(--accent-glow) / 0.5)',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};
