import React from 'react';
import { X, Moon, Sun, Check, Eye, Monitor } from 'lucide-react';
import { Theme } from '../types';
import { ControlToggle } from './ControlToggle';

interface SettingsViewProps {
  currentTheme: Theme;
  showBackgroundVisuals: boolean;
  showVisualPanel: boolean;
  onSetTheme: (theme: Theme) => void;
  onToggleVisuals: () => void;
  onToggleVisualPanel: () => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  showBackgroundVisuals,
  showVisualPanel,
  onSetTheme,
  onToggleVisuals,
  onToggleVisualPanel,
  onClose
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto surface-glass rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
      >
        <X size={22} />
      </button>

      <div className="flex items-baseline gap-3 mb-8">
        <div className="text-micro text-zinc-400">Console</div>
        <h2 className="font-display italic text-[40px] leading-none text-zinc-50">Settings</h2>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-micro text-zinc-400 mb-4">Appearance</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => onSetTheme('dark')}
              className={`relative flex items-center gap-4 p-4 rounded-xl text-left transition-all ring-1 ${
                currentTheme === 'dark'
                  ? 'ring-[rgb(var(--accent-glow)/0.5)] bg-[rgb(var(--accent-glow)/0.06)] text-white'
                  : 'ring-white/10 bg-white/[0.02] text-zinc-400 hover:ring-white/20'
              }`}
            >
              <div className={`p-2 rounded-full ${currentTheme === 'dark' ? 'bg-[rgb(var(--accent-glow)/0.2)] text-[rgb(var(--accent-glow))]' : 'bg-white/5'}`}>
                <Moon size={18} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">TempusSonus Dark</div>
                <div className="text-xs opacity-60">The original console.</div>
              </div>
              {currentTheme === 'dark' && <Check size={16} className="absolute top-3 right-3 text-[rgb(var(--accent-glow))]" />}
            </button>

            <button
              onClick={() => onSetTheme('light')}
              className={`relative flex items-center gap-4 p-4 rounded-xl text-left transition-all ring-1 ${
                currentTheme === 'light'
                  ? 'ring-[rgb(var(--accent-glow)/0.5)] bg-[rgb(var(--accent-glow)/0.06)] text-white'
                  : 'ring-white/10 bg-white/[0.02] text-zinc-400 hover:ring-white/20'
              }`}
            >
              <div className={`p-2 rounded-full ${currentTheme === 'light' ? 'bg-[rgb(var(--accent-glow)/0.2)] text-[rgb(var(--accent-glow))]' : 'bg-white/5'}`}>
                <Sun size={18} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Studio Light</div>
                <div className="text-xs opacity-60">High contrast paper.</div>
              </div>
              {currentTheme === 'light' && <Check size={16} className="absolute top-3 right-3 text-[rgb(var(--accent-glow))]" />}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-full text-zinc-400">
                  <Monitor size={18} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-100">Liquid Field</div>
                  <div className="text-xs text-zinc-500">Full-bleed WebGL background behind the console.</div>
                </div>
              </div>
              <ControlToggle label="" isChecked={showBackgroundVisuals} onToggle={onToggleVisuals} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-full text-zinc-400">
                  <Eye size={18} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-100">Pulse Panel</div>
                  <div className="text-xs text-zinc-500">Legacy visualizer panel below the grid.</div>
                </div>
              </div>
              <ControlToggle label="" isChecked={showVisualPanel} onToggle={onToggleVisualPanel} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-micro text-zinc-400 mb-4">About</h3>
          <div className="p-4 rounded-xl bg-white/[0.02] ring-1 ring-white/10 text-sm text-zinc-400">
            <p className="mb-2"><span className="font-display italic text-zinc-100 text-lg">TempusSonus.ai</span> <span className="font-mono text-xs text-zinc-500 ml-1">v1.4</span></p>
            <p>Designed for professional rhythm training. Optimized for desktop use.</p>
          </div>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
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
