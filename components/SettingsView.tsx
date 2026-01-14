import React from 'react';
import { X, Moon, Sun, Check, Zap, Eye, Monitor } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 relative">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Settings</h2>

      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Appearance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            
            {/* Dark Mode Option */}
            <button
              onClick={() => onSetTheme('dark')}
              className={`
                relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                ${currentTheme === 'dark' 
                  ? 'border-amber-500 bg-zinc-900 text-white' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'
                }
              `}
            >
              <div className={`p-2 rounded-full ${currentTheme === 'dark' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                <Moon size={20} />
              </div>
              <div className="flex-1">
                <div className="font-bold">TempusSonus Dark</div>
                <div className="text-xs opacity-60">The original console experience.</div>
              </div>
              {currentTheme === 'dark' && <div className="absolute top-3 right-3 text-amber-500"><Check size={16} /></div>}
            </button>

            {/* Light Mode Option */}
            <button
              onClick={() => onSetTheme('light')}
              className={`
                relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                ${currentTheme === 'light' 
                  ? 'border-amber-500 bg-white text-zinc-900' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'
                }
              `}
            >
              <div className={`p-2 rounded-full ${currentTheme === 'light' ? 'bg-amber-500/20 text-amber-600' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                <Sun size={20} />
              </div>
              <div className="flex-1">
                <div className="font-bold">Studio Light</div>
                <div className="text-xs opacity-60">High contrast black & white.</div>
              </div>
              {currentTheme === 'light' && <div className="absolute top-3 right-3 text-amber-600"><Check size={16} /></div>}
            </button>

          </div>
          
          <div className="flex flex-col gap-4">
            {/* Ambient Background */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
                   <Monitor size={20} />
                 </div>
                 <div>
                   <div className="font-bold text-zinc-900 dark:text-white">Ambient Background</div>
                   <div className="text-xs text-zinc-500 dark:text-zinc-400">Display subtle liquid visuals on the full screen.</div>
                 </div>
               </div>
               <div>
                  <ControlToggle label="" isChecked={showBackgroundVisuals} onToggle={onToggleVisuals} />
               </div>
            </div>

            {/* Pulse Panel */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
                   <Eye size={20} />
                 </div>
                 <div>
                   <div className="font-bold text-zinc-900 dark:text-white">Pulse Panel</div>
                   <div className="text-xs text-zinc-500 dark:text-zinc-400">Show the dedicated visualizer panel below the grid.</div>
                 </div>
               </div>
               <div>
                  <ControlToggle label="" isChecked={showVisualPanel} onToggle={onToggleVisualPanel} />
               </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">About</h3>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="mb-2"><strong>TempusSonus.ai Console v1.4</strong></p>
            <p>Designed for professional rhythm training. Optimized for desktop use.</p>
          </div>
        </section>
      </div>
      
      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
};