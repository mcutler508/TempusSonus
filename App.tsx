import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Settings2,
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
import { VisualPanel } from './components/VisualPanel';

const App = () => {
  const [state, setState] = useState<EngineState>({
    isPlaying: false,
    bpm: 100,
    timeSignature: TIME_SIGNATURES[0],
    subdivision: Subdivision.Sixteenth,
    audioSubdivision: Subdivision.Quarter,
    selectedRudimentId: 'paradiddle',
    volume: 0.8,
    mirrorMode: false,
    showBackgroundVisuals: true, // shader is the hero now
    showVisualPanel: true,
    visualIntensity: 0.35,       // ambient by default — user can raise it
    theme: 'dark'
  });

  const [measureSync, setMeasureSync] = useState<{ bpm: number; startTime: number }>({ bpm: 100, startTime: 0 });
  const [sessionTime, setSessionTime] = useState(0);
  const [userStats, setUserStats] = useState<UserStats>(scoreService.loadStats());
  const [scoreTrend, setScoreTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [showSettings, setShowSettings] = useState(false);
  const [isBpmPending, setIsBpmPending] = useState(false);

  const [countDownValue, setCountDownValue] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    audioService.setVolume(state.volume);
    const stats = scoreService.loadStats();
    setUserStats(stats);
    updateTrend(stats);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.theme]);

  const updateTrend = (stats: UserStats) => {
    if (stats.currentScore > stats.previousScore) setScoreTrend('up');
    else if (stats.currentScore < stats.previousScore) setScoreTrend('down');
    else setScoreTrend('neutral');
  };

  useEffect(() => { audioService.setAudioSubdivision(state.audioSubdivision); }, [state.audioSubdivision]);
  useEffect(() => { audioService.setTimeSignature(state.timeSignature); }, [state.timeSignature]);

  const currentMeasure = useMemo(() => {
    return generateMeasure(state.timeSignature, state.subdivision, state.selectedRudimentId);
  }, [state.timeSignature, state.subdivision, state.selectedRudimentId]);

  const handleSetTheme = (theme: Theme) => setState(s => ({ ...s, theme }));

  const togglePlay = () => {
    if (state.isPlaying) {
      audioService.stop();
      const newStats = scoreService.recordSession(state.bpm, sessionTime);
      setUserStats(newStats);
      updateTrend(newStats);
      setState(s => ({ ...s, isPlaying: false }));
      setIsBpmPending(false);
    } else if (countDownValue !== null) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountDownValue(null);
    } else {
      audioService.init();
      audioService.setBpm(state.bpm);
      audioService.setAudioSubdivision(state.audioSubdivision);
      audioService.setTimeSignature(state.timeSignature);
      setMeasureSync({ bpm: state.bpm, startTime: 0 });

      const beatMs = (60 / state.bpm) * 1000;
      setCountDownValue(3);

      countdownIntervalRef.current = window.setInterval(() => {
        setCountDownValue(prev => {
          if (prev === 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            audioService.start((info: MeasureBoundaryInfo) => {
              if (info.beatIndex === 0) {
                setMeasureSync({ bpm: info.bpm, startTime: info.time });
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
    if (state.isPlaying && sessionTime > 10) {
      const newStats = scoreService.recordSession(state.bpm, sessionTime);
      setUserStats(newStats);
      updateTrend(newStats);
    }
    setSessionTime(0);
    if (countDownValue !== null && countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      setCountDownValue(null);
    }
  };

  const toggleMirrorMode = () => setState(s => ({ ...s, mirrorMode: !s.mirrorMode }));
  const handleVolumeChange = (vol: number) => {
    setState(s => ({ ...s, volume: vol }));
    audioService.setVolume(vol);
  };

  useEffect(() => {
    let interval: number;
    if (state.isPlaying) {
      interval = window.setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state.isPlaying]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
    if (state.isPlaying) setIsBpmPending(true);
    else setMeasureSync({ bpm: clamped, startTime: 0 });
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

  const scoreDelta = userStats.currentScore - userStats.previousScore;
  const canvasBg = state.theme === 'dark' ? 'canvas-ambient-dark' : 'canvas-ambient-light';
  const textBase = state.theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900';

  return (
    <div className={`relative w-full min-h-screen lg:h-screen flex flex-col items-center py-4 px-3 sm:py-6 sm:px-4 lg:py-8 select-none overflow-x-hidden overflow-y-auto lg:overflow-hidden ${canvasBg} ${textBase} transition-colors duration-500`}>

      {/* 0. FULL-BLEED SHADER HERO BACKGROUND */}
      {state.showBackgroundVisuals && (
        <VisualPanel
          isPlaying={state.isPlaying}
          bpm={state.bpm}
          theme={state.theme}
          timeSignature={state.timeSignature}
          measureSync={measureSync}
          fullBleed
          intensity={state.visualIntensity}
        />
      )}

      {/* Film grain overlay (fixed, above shader, below UI) */}
      <div className="grain-overlay" />

      {/* Top/bottom vignette mask so glass panels read cleanly */}
      <div className="absolute inset-0 pointer-events-none z-[1] dark:bg-[radial-gradient(80%_100%_at_50%_50%,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      {/* 1. HUD HEADER — sits in its own tinted glass shell so it reads against busy shader */}
      <header className="relative z-10 w-full max-w-7xl flex items-end justify-between pb-4 mb-4 px-4 py-4 rounded-2xl surface-glass sm:pb-6 sm:mb-8 sm:px-6 sm:py-5">
        {/* Score */}
        <div className="flex flex-col gap-1 relative z-10">
          <div className="text-micro text-zinc-500 dark:text-zinc-400">Hand Fitness</div>
          <div className="flex items-baseline gap-4">
            <span
              className="font-display italic leading-[0.85] text-zinc-900 dark:text-zinc-50"
              style={{
                fontSize: 'clamp(2.5rem, 11vw, 4.5rem)',
                textShadow: state.theme === 'dark' ? '0 2px 24px rgba(0,0,0,0.6)' : '0 1px 2px rgba(255,255,255,0.8)'
              }}
            >
              {userStats.currentScore}
            </span>
            {scoreDelta !== 0 && (
              <span className={`flex items-center gap-1 text-[13px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full ring-1 ${
                scoreTrend === 'up' ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 ring-emerald-500/30' :
                scoreTrend === 'down' ? 'text-red-700 dark:text-red-300 bg-red-500/15 ring-red-500/30' :
                'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 ring-zinc-500/20'
              }`}>
                {scoreTrend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : scoreTrend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {scoreTrend === 'up' ? '+' : ''}{scoreDelta}
              </span>
            )}
          </div>
        </div>

        {/* Editorial divider */}
        <div className="hidden sm:flex flex-1 items-center mx-4 sm:mx-6 lg:mx-12 self-end pb-3 relative z-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-400/30 dark:via-white/15 to-transparent"></div>
          <div className="w-1 h-1 rounded-full bg-[rgb(var(--accent-glow))] shadow-[0_0_8px_rgb(var(--accent-glow))] mx-3"></div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-400/30 dark:via-white/15 to-transparent"></div>
        </div>

        {/* Live metrics */}
        <div className="flex items-baseline gap-4 sm:gap-6 lg:gap-10 relative z-10">
          <div className="flex flex-col items-start">
            <span className="text-micro text-zinc-500 dark:text-zinc-400 mb-1 sm:mb-2">Session</span>
            <span
              className="font-display italic leading-none text-zinc-900 dark:text-zinc-50"
              style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.5rem)' }}
            >
              {formatTime(sessionTime)}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-micro text-zinc-500 dark:text-zinc-400 mb-1 sm:mb-2">BPM</span>
            <span
              className={`font-display italic leading-none transition-colors ${
                state.isPlaying ? 'text-[rgb(var(--accent-glow))]' : 'text-zinc-900 dark:text-zinc-50'
              } ${isBpmPending ? 'animate-pulse opacity-60' : ''}`}
              style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.5rem)' }}
            >
              {state.bpm}
            </span>
          </div>
        </div>
      </header>

      {/* CENTER WORKSPACE */}
      <div className="relative z-10 flex-1 w-full max-w-7xl flex flex-col items-center justify-start lg:justify-center">

        {/* SETTINGS OVERLAY */}
        {showSettings && (
          <div className="fixed sm:absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] sm:backdrop-blur-md animate-in fade-in duration-200">
            <SettingsView
              currentTheme={state.theme}
              showBackgroundVisuals={state.showBackgroundVisuals}
              showVisualPanel={state.showVisualPanel}
              visualIntensity={state.visualIntensity}
              onSetTheme={handleSetTheme}
              onToggleVisuals={() => setState(s => ({ ...s, showBackgroundVisuals: !s.showBackgroundVisuals }))}
              onToggleVisualPanel={() => setState(s => ({ ...s, showVisualPanel: !s.showVisualPanel }))}
              onSetVisualIntensity={(v) => setState(s => ({ ...s, visualIntensity: Math.max(0, Math.min(1, v)) }))}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}

        {/* MAIN VISUALIZER */}
        <main className={`w-full flex flex-col items-center justify-center relative transition-opacity duration-300 ${showSettings ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>

          {/* COUNTDOWN */}
          {countDownValue !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[3px] bg-black/40 rounded-2xl">
              <div
                key={countDownValue}
                className="font-display italic leading-none text-[rgb(var(--accent-glow))] animate-countdown-in"
                style={{
                  fontSize: 'clamp(5rem, 28vw, 11.25rem)',
                  textShadow: '0 0 60px rgb(var(--accent-glow) / 0.7), 0 0 120px rgb(var(--accent-glow) / 0.35)'
                }}
              >
                {countDownValue}
              </div>
            </div>
          )}

          {/* Active Pattern Info — chipified so it reads against busy shader */}
          <div className="mb-3 sm:mb-5 lg:mb-7 flex items-center gap-2 sm:gap-3 token-chip rounded-full px-3 sm:px-4 py-1.5 sm:py-2 max-w-full">
            <span className="text-micro text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{state.timeSignature.name}</span>
            <span className="w-px h-3 bg-zinc-300/50 dark:bg-white/15 shrink-0"></span>
            <span className="text-micro text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{SUBDIVISIONS.find(s => s.value === state.subdivision)?.label} Grid</span>
            <span className="w-px h-3 bg-zinc-300/50 dark:bg-white/15 shrink-0"></span>
            <span className="font-display italic text-base sm:text-lg lg:text-[20px] leading-none text-zinc-900 dark:text-zinc-50 tracking-tight pb-0.5 truncate">{currentRudimentName}</span>
          </div>

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

        {/* CONTROL CONSOLE — glass panel so it reads against shader */}
        <footer className={`w-full mt-4 sm:mt-6 lg:mt-10 transition-opacity duration-300 ${showSettings ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>

          {/* Dials Row */}
          <div className="relative surface-glass rounded-2xl grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-5 lg:gap-8 px-3 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-6 justify-items-center">
            <div className="col-span-3 sm:col-span-4 lg:col-span-1 flex justify-center w-full">
              <TempoDial
                label="Tempo"
                value={state.bpm}
                onChange={setBpm}
                subValue="BPM"
                isPending={isBpmPending}
              />
            </div>
            <ControlDial
              label="Time Sig"
              value={state.timeSignature.name}
              onDecrease={cycleTimeSig}
              onIncrease={cycleTimeSig}
              subValue="Meter"
            />
            <ControlDial
              label="Grid"
              value={SUBDIVISIONS.find(s => s.value === state.subdivision)?.label || '16th'}
              onDecrease={cycleVisualSubdivision}
              onIncrease={cycleVisualSubdivision}
              subValue="Visual"
            />
            <ControlDial
              label="Click"
              value={currentAudioLabel}
              onDecrease={cycleAudioSubdivision}
              onIncrease={cycleAudioSubdivision}
              subValue="Audio"
            />
            <ControlDial
              label="Rudiment"
              value={state.selectedRudimentId === 'five-stroke' ? '5-Str' : currentRudimentName?.split(' ')[0] || 'Single'}
              onDecrease={() => cycleRudiment(-1)}
              onIncrease={() => cycleRudiment(1)}
              subValue="Phrase"
            />
            <ControlToggle
              label="Mirror"
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
          <div className="flex items-center justify-center gap-6 sm:gap-8 mt-5 sm:mt-8">
            <button
              onClick={resetSession}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:text-white active:bg-white/10 transition-all ring-1 ring-transparent hover:ring-white/10 focus-visible:outline-none focus-visible:ring-[rgb(var(--accent-glow))]"
              aria-label="Reset Session"
              title="Reset Session"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Play orb */}
            <div className="relative">
              {/* Ambient pulsing halo (idle only) */}
              {!state.isPlaying && countDownValue === null && (
                <div
                  className="absolute -inset-3 rounded-full animate-breathe pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgb(var(--accent-glow) / 0.35), transparent 70%)',
                    filter: 'blur(14px)',
                  }}
                />
              )}

              <button
                onClick={togglePlay}
                className={`
                  relative h-[80px] w-[80px] rounded-full flex items-center justify-center
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-glow))] focus-visible:ring-offset-4 focus-visible:ring-offset-black
                  ${state.isPlaying || countDownValue !== null
                    ? 'bg-white/[0.04] text-[rgb(var(--accent-glow))] ring-1 ring-[rgb(var(--accent-glow)/0.5)]'
                    : 'text-black hover:scale-[1.04] active:scale-[0.98]'
                  }
                `}
                style={{
                  background: state.isPlaying || countDownValue !== null
                    ? undefined
                    : 'radial-gradient(circle at 30% 25%, rgb(var(--accent-glow-soft)), rgb(var(--accent-glow)) 55%, rgb(var(--accent-glow) / 0.9))',
                  boxShadow: state.isPlaying || countDownValue !== null
                    ? '0 0 0 1px rgb(var(--accent-glow) / 0.5), 0 0 30px rgb(var(--accent-glow) / 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 0 0 1px rgb(var(--accent-glow) / 0.6), 0 10px 30px -4px rgb(var(--accent-glow) / 0.55), 0 0 60px rgb(var(--accent-glow) / 0.35), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -6px 12px rgba(0,0,0,0.2)',
                }}
              >
                {state.isPlaying || countDownValue !== null ? (
                  <Square className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-8 h-8 ml-1 fill-current" />
                )}
              </button>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:text-white active:bg-white/10 transition-all ring-1 ring-transparent hover:ring-white/10 focus-visible:outline-none focus-visible:ring-[rgb(var(--accent-glow))]"
              aria-label="Settings"
              title="Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
