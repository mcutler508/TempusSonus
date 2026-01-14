import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw,
  Settings2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { EngineState, Subdivision, Theme } from './types';
import { RUDIMENTS, TIME_SIGNATURES, SUBDIVISIONS } from './constants';
import { generateMeasure } from './services/rhythmEngine';
import { audioService, MeasureBoundaryInfo } from './services/audioService';
import { scoreService, UserStats } from './services/scoreService';
import { ScoreConveyor } from './components/ScoreConveyor';
import { ControlDial } from './components/ControlDial';
import { TempoDial } from './components/TempoDial';
import { ControlToggle } from './components/ControlToggle';
import { ControlSlider } from './components/ControlSlider';
import { SettingsView } from './components/SettingsView';
import { VisualField } from './components/VisualField';
import { VisualPanel } from './components/VisualPanel';

const App = () => {
  // --- Global State ---
  const [state, setState] = useState<EngineState>({
    isPlaying: false,
    bpm: 100,
    timeSignature: TIME_SIGNATURES[0], // 4/4
    subdivision: Subdivision.Sixteenth, // Visual Grid
    audioSubdivision: Subdivision.Quarter, // Audio Click
    selectedRudimentId: 'paradiddle',
    volume: 0.8,
    mirrorMode: false,
    showBackgroundVisuals: false, // Default off in favor of Panel
    showVisualPanel: true,        // Default on for the new panel
    theme: 'dark' // Default theme
  });

  // Consolidate Active Measure State (received from AudioService lookahead)
  const [measureSync, setMeasureSync] = useState<{ bpm: number; startTime: number }>({ bpm: 100, startTime: 0 });

  const [sessionTime, setSessionTime] = useState(0);
  const [userStats, setUserStats] = useState<UserStats>(scoreService.loadStats());
  const [scoreTrend, setScoreTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [showSettings, setShowSettings] = useState(false);
  const [isBpmPending, setIsBpmPending] = useState(false);
  
  // Countdown State
  const [countDownValue, setCountDownValue] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Init Audio Volume & Stats & Theme
  useEffect(() => {
    audioService.setVolume(state.volume);
    const stats = scoreService.loadStats();
    setUserStats(stats);
    updateTrend(stats);
  }, []);

  // Sync Theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const updateTrend = (stats: UserStats) => {
    if (stats.currentScore > stats.previousScore) setScoreTrend('up');
    else if (stats.currentScore < stats.previousScore) setScoreTrend('down');
    else setScoreTrend('neutral');
  };

  // --- Sync Audio Service with State ---
  useEffect(() => {
    // Only update the Audio Service with the AUDIO subdivision
    audioService.setAudioSubdivision(state.audioSubdivision);
  }, [state.audioSubdivision]);

  useEffect(() => {
    audioService.setTimeSignature(state.timeSignature);
  }, [state.timeSignature]);

  // --- Derived State (The Measure) ---
  const currentMeasure = useMemo(() => {
    return generateMeasure(
      state.timeSignature,
      state.subdivision, // Visual measure generation uses visual subdivision
      state.selectedRudimentId
    );
  }, [state.timeSignature, state.subdivision, state.selectedRudimentId]);

  // --- Handlers ---

  const handleSetTheme = (theme: Theme) => {
    setState(s => ({ ...s, theme }));
  };

  const togglePlay = () => {
    if (state.isPlaying) {
      // STOPPING
      audioService.stop();
      
      // Record Session Stats
      const newStats = scoreService.recordSession(state.bpm, sessionTime);
      setUserStats(newStats);
      updateTrend(newStats);

      setState(s => ({ ...s, isPlaying: false }));
      setIsBpmPending(false); // Reset pending state
    } else if (countDownValue !== null) {
      // CANCELLING COUNTDOWN
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountDownValue(null);
    } else {
      // STARTING COUNTDOWN
      audioService.init();

      // Ensure AudioService has latest config before starting
      audioService.setBpm(state.bpm);
      audioService.setAudioSubdivision(state.audioSubdivision);
      audioService.setTimeSignature(state.timeSignature);
      
      // Preset sync state
      setMeasureSync({ bpm: state.bpm, startTime: 0 });

      const beatMs = (60 / state.bpm) * 1000;
      setCountDownValue(3);

      countdownIntervalRef.current = window.setInterval(() => {
        setCountDownValue(prev => {
          if (prev === 1) {
            // Count finished, start engine
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            
            // Start actual playback with lookahead callback
            audioService.start((info: MeasureBoundaryInfo) => {
              // This fires ~100ms BEFORE the beat
              // On Downbeat (0), we update the Visual Sync params
              if (info.beatIndex === 0) {
                 setMeasureSync({ bpm: info.bpm, startTime: info.time });
                 
                 // If we had a pending BPM change, we can consider it "consumed" by the audio engine now
                 setIsBpmPending(false);
              }
            });
            
            setState(s => ({ ...s, isPlaying: true }));
            return null;
          }
          return (prev || 0) - 1;
        });
      }, beatMs);
    }
  };

  const resetSession = () => {
    // If resetting while playing, we should probably record the partial session first
    if (state.isPlaying && sessionTime > 10) {
        const newStats = scoreService.recordSession(state.bpm, sessionTime);
        setUserStats(newStats);
        updateTrend(newStats);
    }
    
    setSessionTime(0);
    // If counting down, cancel it
    if (countDownValue !== null && countdownIntervalRef.current) {
       clearInterval(countdownIntervalRef.current);
       setCountDownValue(null);
    }
  };

  const toggleMirrorMode = () => {
    setState(s => ({ ...s, mirrorMode: !s.mirrorMode }));
  };

  const handleVolumeChange = (vol: number) => {
    setState(s => ({ ...s, volume: vol }));
    audioService.setVolume(vol);
  };

  // --- Timer ---
  useEffect(() => {
    let interval: number;
    if (state.isPlaying) {
      interval = window.setInterval(() => {
        setSessionTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isPlaying]);

  // --- Format Timer ---
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Control Logic Helpers ---
  const cycleTimeSig = () => {
    const idx = TIME_SIGNATURES.indexOf(state.timeSignature);
    const next = TIME_SIGNATURES[(idx + 1) % TIME_SIGNATURES.length];
    setState(s => ({ ...s, timeSignature: next }));
  };

  const cycleVisualSubdivision = () => {
    const idx = SUBDIVISIONS.findIndex(sub => sub.value === state.subdivision);
    const next = SUBDIVISIONS[(idx + 1) % SUBDIVISIONS.length];
    setState(s => ({ ...s, subdivision: next.value }));
  };
  
  const cycleAudioSubdivision = () => {
    const audioOptions = [
      { value: Subdivision.Quarter, label: '1/4' },
      ...SUBDIVISIONS
    ];
    
    const currentIdx = audioOptions.findIndex(opt => opt.value === state.audioSubdivision);
    const nextIdx = (currentIdx + 1) % audioOptions.length;
    setState(s => ({ ...s, audioSubdivision: audioOptions[nextIdx].value }));
  };

  const setBpm = (newBpm: number) => {
    const clamped = Math.max(40, Math.min(240, newBpm));
    setState(s => ({ ...s, bpm: clamped }));
    audioService.setBpm(clamped);
    
    // If currently playing, the BPM change is pending until next measure
    if (state.isPlaying) {
      setIsBpmPending(true);
    } else {
      // If stopped, update measure sync immediately so visuals match dial
      setMeasureSync({ bpm: clamped, startTime: 0 });
    }
  };

  const cycleRudiment = (dir: 1 | -1) => {
    const idx = RUDIMENTS.findIndex(r => r.id === state.selectedRudimentId);
    let nextIdx = idx + dir;
    if (nextIdx >= RUDIMENTS.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = RUDIMENTS.length - 1;
    setState(s => ({ ...s, selectedRudimentId: RUDIMENTS[nextIdx].id }));
  };

  const currentRudimentName = RUDIMENTS.find(r => r.id === state.selectedRudimentId)?.name;
  
  const currentAudioLabel = 
    state.audioSubdivision === Subdivision.Quarter ? '1/4' : 
    SUBDIVISIONS.find(s => s.value === state.audioSubdivision)?.label || '1/4';

  return (
    <div className={`w-full min-h-screen flex flex-col items-center py-6 px-4 select-none overflow-x-hidden transition-colors duration-300 ${state.theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-white text-zinc-900'}`}>
      
      {/* 0. GPU BACKGROUND LAYER (Optional Full Screen) */}
      {state.showBackgroundVisuals && (
        <VisualField 
          isPlaying={state.isPlaying} 
          bpm={state.bpm} 
          theme={state.theme} 
        />
      )}

      {/* 1. SESSION HEADER */}
      <header className="w-full max-w-7xl flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-4 relative z-10">
        
        {/* Hand Fitness Score Badge */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold tracking-widest uppercase mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            Hand Fitness Score
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-mono font-bold text-zinc-900 dark:text-white leading-none">
              {userStats.currentScore}
            </span>
            
            <div className={`flex items-center gap-1 text-sm font-bold ${
                scoreTrend === 'up' ? 'text-green-500' : 
                scoreTrend === 'down' ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-600'
            }`}>
              {scoreTrend === 'up' && <TrendingUp className="w-4 h-4" />}
              {scoreTrend === 'down' && <TrendingDown className="w-4 h-4" />}
              {scoreTrend === 'neutral' && <Minus className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex gap-12 font-mono text-4xl font-bold text-zinc-300 dark:text-zinc-200">
          <div className="flex flex-col items-center">
            <span className="text-xs text-zinc-400 dark:text-zinc-600 font-sans font-semibold tracking-widest mb-1">SESSION</span>
            <span className={state.theme === 'light' ? 'text-zinc-900' : ''}>{formatTime(sessionTime)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-zinc-400 dark:text-zinc-600 font-sans font-semibold tracking-widest mb-1">BPM</span>
            <span className={`${state.isPlaying ? "text-amber-500" : (state.theme === 'light' ? 'text-zinc-900' : '')} ${isBpmPending ? 'animate-pulse opacity-50' : ''}`}>
               {/* Show the Target BPM (state.bpm) here so user sees what they dialled */}
               {state.bpm}
            </span>
          </div>
        </div>
      </header>

      {/* CENTER WORKSPACE (Grid + Footer Grouped) */}
      <div className="flex-1 w-full max-w-7xl flex flex-col items-center justify-center relative z-10">

        {/* SETTINGS OVERLAY */}
        {showSettings && (
           <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
             <SettingsView 
               currentTheme={state.theme} 
               showBackgroundVisuals={state.showBackgroundVisuals}
               showVisualPanel={state.showVisualPanel}
               onSetTheme={handleSetTheme} 
               onToggleVisuals={() => setState(s => ({ ...s, showBackgroundVisuals: !s.showBackgroundVisuals }))}
               onToggleVisualPanel={() => setState(s => ({ ...s, showVisualPanel: !s.showVisualPanel }))}
               onClose={() => setShowSettings(false)} 
             />
           </div>
        )}

        {/* 2. MAIN VISUALIZER (Center Score Conveyor) */}
        <main className={`w-full flex flex-col items-center justify-center relative transition-opacity duration-300 ${showSettings ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
          
          {/* COUNTDOWN OVERLAY */}
          {countDownValue !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-950/60 backdrop-blur-[2px] rounded-xl transition-all">
              <div 
                key={countDownValue} 
                className="text-[12rem] leading-none font-black text-amber-500 animate-[bounce_0.5s_infinite] drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]"
              >
                {countDownValue}
              </div>
            </div>
          )}

          {/* Active Pattern Info */}
          <div className="mb-8 flex items-center gap-3 text-zinc-400 dark:text-zinc-400">
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400">{state.timeSignature.name}</span>
            <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full"></span>
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400">
              {SUBDIVISIONS.find(s => s.value === state.subdivision)?.label} GRID
            </span>
            <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full"></span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white tracking-wide">{currentRudimentName}</span>
          </div>

          {/* The Engine */}
          <div className={`w-full flex justify-center transition-all duration-300 ${countDownValue !== null ? "opacity-30 blur-sm" : ""}`}>
            <ScoreConveyor 
              measure={currentMeasure} 
              measureSync={measureSync} 
              isPlaying={state.isPlaying}
              subdivision={state.subdivision}
              mirrorMode={state.mirrorMode}
            />
          </div>

        </main>

        {/* Spacer / Visual Panel Area */}
        <div className="h-32 w-full shrink-0 flex items-center justify-center my-2">
           {state.showVisualPanel && (
             <div className="w-full max-w-5xl h-full mx-4 shadow-sm dark:shadow-black/40">
                <VisualPanel 
                   isPlaying={state.isPlaying}
                   bpm={state.bpm}
                   theme={state.theme}
                   timeSignature={state.timeSignature}
                   measureSync={measureSync}
                />
             </div>
           )}
        </div>

        {/* 3. CONTROL CONSOLE */}
        <footer className={`w-full transition-opacity duration-300 ${showSettings ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
          
          {/* Dials Row - Updated to 7 columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-8 bg-zinc-100/50 dark:bg-zinc-900/40 p-6 lg:p-8 rounded-xl border border-zinc-200 dark:border-zinc-800/50 backdrop-blur-sm justify-items-center shadow-lg dark:shadow-black/20">
            
            <TempoDial 
              label="Tempo" 
              value={state.bpm} /* Control the Target BPM */
              onChange={setBpm} 
              subValue="BPM"
              isPending={isBpmPending}
            />

            <ControlDial 
              label="Time Sig" 
              value={state.timeSignature.name} 
              onDecrease={cycleTimeSig} 
              onIncrease={cycleTimeSig} 
              subValue="METER"
            />

            <ControlDial 
              label="Grid" 
              value={SUBDIVISIONS.find(s => s.value === state.subdivision)?.label || '16th'} 
              onDecrease={cycleVisualSubdivision} 
              onIncrease={cycleVisualSubdivision} 
              subValue="VISUAL"
            />
            
            <ControlDial 
              label="Click" 
              value={currentAudioLabel} 
              onDecrease={cycleAudioSubdivision} 
              onIncrease={cycleAudioSubdivision} 
              subValue="AUDIO"
            />

            <ControlDial 
              label="Rudiment" 
              value={state.selectedRudimentId === 'five-stroke' ? '5-Str' : currentRudimentName?.split(' ')[0] || 'Single'} 
              onDecrease={() => cycleRudiment(-1)} 
              onIncrease={() => cycleRudiment(1)} 
              subValue="PHRASE"
            />

            {/* Subd Guides Toggle REMOVED */}

            <ControlToggle 
              label="Mirror Hands" 
              isChecked={state.mirrorMode} 
              onToggle={toggleMirrorMode} 
            />

            <ControlSlider 
              label="Master Vol"
              value={state.volume}
              onChange={handleVolumeChange}
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-center gap-6 mt-6 mb-2">
            <button 
              onClick={resetSession}
              className="p-4 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
              title="Reset Session"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            <button 
              onClick={togglePlay}
              className={`
                h-20 w-20 rounded-full flex items-center justify-center
                transition-all duration-200 shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]
                ${state.isPlaying || countDownValue !== null
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-amber-500 border border-amber-500/50 dark:border-amber-900/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                  : 'bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-400 dark:hover:bg-amber-500 hover:scale-105 border border-amber-400/20'
                }
              `}
            >
              {state.isPlaying || countDownValue !== null ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 ml-1 fill-current" />
              )}
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-4 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
              title="Settings"
            >
              <Settings2 className="w-6 h-6" />
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default App;