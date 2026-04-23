import React, { useEffect, useRef, useState } from 'react';
import { Measure, Note, Subdivision } from '../types';
import { getMeasureDuration } from '../services/rhythmEngine';
import { audioService } from '../services/audioService';

interface MeasureSyncData {
  startTime: number;
  bpm: number;
}

interface ScoreConveyorProps {
  measure: Measure;
  measureSync: MeasureSyncData;
  isPlaying: boolean;
  subdivision: Subdivision;
  mirrorMode: boolean;
}

export const ScoreConveyor: React.FC<ScoreConveyorProps> = ({
  measure,
  measureSync,
  isPlaying,
  subdivision,
  mirrorMode
}) => {
  const [playheadProgress, setPlayheadProgress] = useState(0);
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);
  const [flashBeat, setFlashBeat] = useState<{ index: number; key: number } | null>(null);
  const requestRef = useRef<number>(0);
  const lastBeatIndexRef = useRef<number>(-1);

  const activeParams = useRef<MeasureSyncData>({ startTime: 0, bpm: 100 });
  const nextParams = useRef<MeasureSyncData | null>(null);

  // Sync incoming measure data to refs
  useEffect(() => {
    if (!isPlaying) {
      setPlayheadProgress(0);
      setActiveNoteIndex(-1);
      lastBeatIndexRef.current = -1;
      return;
    }

    const currentTime = audioService.getCurrentTime();
    if (measureSync.startTime > currentTime + 0.02) {
      nextParams.current = measureSync;
    } else {
      activeParams.current = measureSync;
      nextParams.current = null;
    }
  }, [measureSync, isPlaying]);

  const totalNotes = measure.notes.length;
  const slotsPerBeat = totalNotes / measure.timeSignature.top;

  // Animation loop
  const animate = () => {
    if (!isPlaying) return;

    const currentTime = audioService.getCurrentTime();

    if (nextParams.current && currentTime >= nextParams.current.startTime) {
      activeParams.current = nextParams.current;
      nextParams.current = null;
    }

    const measureDuration = getMeasureDuration(activeParams.current.bpm, measure.timeSignature);
    const elapsed = currentTime - activeParams.current.startTime;
    const safeElapsed = Math.max(0, elapsed);
    const progress = (safeElapsed % measureDuration) / measureDuration;
    const currentIndex = Math.floor(progress * totalNotes);
    const currentBeat = Math.floor(progress * measure.timeSignature.top);

    // Trigger beat flash on downbeat transitions
    if (currentBeat !== lastBeatIndexRef.current) {
      lastBeatIndexRef.current = currentBeat;
      setFlashBeat({ index: currentBeat, key: performance.now() });
    }

    setPlayheadProgress(progress);
    setActiveNoteIndex(currentIndex);

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setFlashBeat(null);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const renderMicroGrid = () => {
    let ticks = 0;
    if (subdivision === Subdivision.Sixteenth) ticks = 3;
    else if (subdivision === Subdivision.Triplet) ticks = 2;
    else if (subdivision === Subdivision.Eighth) ticks = 1;
    if (ticks === 0) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-around opacity-25 dark:opacity-15 z-10 pointer-events-none">
        {Array.from({ length: ticks }).map((_, i) => {
          const isMiddle = (ticks % 2 !== 0) && (i === Math.floor(ticks / 2));
          const heightClass = isMiddle ? "h-3" : "h-1.5";
          return (
            <div key={i} className={`w-px ${heightClass} bg-zinc-300 dark:bg-zinc-400 rounded-full`}></div>
          );
        })}
      </div>
    );
  };

  const renderNoteRow = (type: 'primary' | 'mirror') => {
    return (
      <div className="absolute inset-0 flex items-center px-0 w-full h-full">
        {measure.notes.map((note, idx) => {
          let displayHand = note.hand;
          if (type === 'mirror') {
            if (note.hand === 'R') displayHand = 'L';
            else if (note.hand === 'L') displayHand = 'R';
          }

          const isAccent = note.type === 'accent';
          const isGhost = note.hand === '-';
          const isFlam = note.type === 'flam';
          const isDrag = note.type === 'drag';
          const isActive = idx === activeNoteIndex;
          const isRight = displayHand === 'R';

          const widthPct = 100 / totalNotes;
          const handVar = isRight ? '--accent-hand-r' : '--accent-hand-l';

          // Subdivision counting
          let subText = '';
          const currentBeat = Math.floor(idx / slotsPerBeat) + 1;
          const subIdx = idx % slotsPerBeat;
          if (subdivision === Subdivision.Sixteenth) {
            if (subIdx === 0) subText = currentBeat.toString();
            else if (subIdx === 1) subText = 'e';
            else if (subIdx === 2) subText = '&';
            else if (subIdx === 3) subText = 'a';
          } else if (subdivision === Subdivision.Triplet) {
            if (subIdx === 0) subText = currentBeat.toString();
            else if (subIdx === 1) subText = 'trip';
            else if (subIdx === 2) subText = 'let';
          } else if (subdivision === Subdivision.Eighth) {
            if (subIdx === 0) subText = currentBeat.toString();
            else if (subIdx === 1) subText = '&';
          } else {
            if (subIdx === 0) subText = currentBeat.toString();
          }

          return (
            <div
              key={`${type}-${note.id}`}
              className="h-full flex flex-col items-center justify-center relative"
              style={{ width: `${widthPct}%` }}
            >
              {!isGhost && (
                <div
                  key={isActive ? `active-${idx}` : `idle-${idx}`}
                  className={`
                    relative flex items-center justify-center
                    w-8 h-11 sm:w-10 sm:h-12 lg:w-11 lg:h-14 rounded-lg
                    font-semibold text-[16px] sm:text-[19px] lg:text-[22px] select-none
                    transition-[transform,filter] duration-100
                    ${!isRight ? 'italic' : ''}
                    ${isActive ? 'scale-110 -translate-y-1 z-10 animate-ignite' : isAccent ? 'scale-[1.04]' : 'scale-100'}
                    ${type === 'mirror' ? 'opacity-85' : ''}
                  `}
                  style={{
                    color: isActive ? '#ffffff' : `rgb(var(${handVar}))`,
                    background: isActive
                      ? `radial-gradient(circle at 50% 40%, rgb(var(${handVar}) / 1) 0%, rgb(var(${handVar}) / 0.85) 70%)`
                      : `linear-gradient(180deg, rgb(var(${handVar}) / 0.18), rgb(var(${handVar}) / 0.08))`,
                    border: `1px solid rgb(var(${handVar}) / ${isActive ? 0.9 : 0.35})`,
                    boxShadow: isActive
                      ? `0 0 0 1px rgb(var(${handVar}) / 0.7), 0 0 28px 4px rgb(var(${handVar}) / 0.55), 0 0 60px 12px rgb(var(${handVar}) / 0.3), inset 0 1px 0 rgba(255,255,255,0.25)`
                      : `0 4px 16px -6px rgb(var(${handVar}) / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.1)`,
                  }}
                >
                  {/* Soft outer halo (idle) */}
                  {!isActive && (
                    <span
                      className="absolute -inset-1 rounded-xl pointer-events-none"
                      style={{ background: `radial-gradient(circle, rgb(var(${handVar}) / 0.18), transparent 70%)`, filter: 'blur(6px)' }}
                    />
                  )}

                  {/* Grace notes */}
                  {isFlam && (
                    <span className="absolute -left-3.5 top-3 text-[11px] opacity-70 font-normal text-zinc-400">
                      {displayHand === 'R' ? 'l' : 'r'}
                    </span>
                  )}
                  {isDrag && (
                    <span className="absolute -left-4 top-3 text-[10px] opacity-70 font-normal text-zinc-400 tracking-tighter">
                      {displayHand === 'R' ? 'll' : 'rr'}
                    </span>
                  )}

                  <span className="relative z-10">{displayHand}</span>

                  {/* Accent indicator — thin top bracket */}
                  {isAccent && (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                      style={{ background: `rgb(var(${handVar}))`, boxShadow: `0 0 8px rgb(var(${handVar}) / 0.8)` }}
                    />
                  )}
                </div>
              )}

              {/* Ghost placeholder */}
              {isGhost && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
              )}

              {/* Sticking / counting text */}
              {type === 'primary' && (
                <span
                  className={`absolute -bottom-5 sm:-bottom-7 text-[8px] sm:text-[10px] font-mono font-semibold tracking-[0.1em] sm:tracking-[0.15em] transition-colors uppercase ${
                    isActive ? 'text-[rgb(var(--accent-glow-soft))]' : 'text-zinc-500/70'
                  }`}
                >
                  {subText}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-full sm:max-w-3xl lg:max-w-5xl h-48 sm:h-56 lg:h-64 surface-glass select-none overflow-hidden rounded-2xl mx-2 sm:mx-4 transition-all duration-500">
      {/* Stationary beat grid */}
      <div className="absolute inset-0 flex w-full h-full pointer-events-none">
        {Array.from({ length: measure.timeSignature.top }).map((_, i) => {
          const isFlashing = flashBeat && flashBeat.index === i;
          return (
            <div
              key={`beat-${i}`}
              className="flex-1 border-r border-white/[0.04] dark:border-white/[0.04] h-full last:border-r-0 relative"
            >
              {/* Beat flash (downbeat = amber, other beats = soft white) */}
              {isFlashing && (
                <div
                  key={flashBeat.key}
                  className="absolute inset-0 animate-[beat-flash_350ms_ease-out_forwards]"
                  style={{
                    background: i === 0
                      ? 'linear-gradient(180deg, rgb(var(--accent-glow) / 0.22), rgb(var(--accent-glow) / 0.04) 70%, transparent)'
                      : 'linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 70%)',
                  }}
                />
              )}

              {renderMicroGrid()}

              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[8px] sm:text-[9px] font-mono font-semibold text-zinc-500/40 dark:text-zinc-500/35 tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 z-20 ${mirrorMode ? 'gap-2 sm:gap-8' : 'gap-0'}`}>
        <div className={`relative w-full h-16 sm:h-20 transition-all duration-500 ${mirrorMode ? '-translate-y-1 sm:-translate-y-3' : 'translate-y-0'}`}>
          <div className={`hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 font-mono -rotate-90 origin-right whitespace-nowrap tracking-[0.2em] transition-opacity duration-500 ${mirrorMode ? 'opacity-60' : 'opacity-0'}`}>
            PRIMARY
          </div>
          {renderNoteRow('primary')}
        </div>

        <div className={`relative w-full h-16 sm:h-20 transition-all duration-500 ${mirrorMode ? 'opacity-100 translate-y-1 sm:translate-y-2' : 'opacity-0 translate-y-10 pointer-events-none absolute bottom-0'}`}>
          <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 font-mono -rotate-90 origin-right whitespace-nowrap opacity-60 tracking-[0.2em]">
            INVERTED
          </div>
          {renderNoteRow('mirror')}
        </div>
      </div>

      {/* Playhead beam + trailing comet */}
      {isPlaying && (
        <>
          {/* Trailing gradient comet behind the beam */}
          <div
            className="absolute top-0 bottom-0 z-40 pointer-events-none transition-none"
            style={{
              left: `${playheadProgress * 100}%`,
              width: '90px',
              marginLeft: '-90px',
              background: 'linear-gradient(90deg, transparent, rgb(var(--accent-glow) / 0.04) 30%, rgb(var(--accent-glow) / 0.18))',
              mixBlendMode: 'screen',
            }}
          />

          {/* Main beam */}
          <div
            className="absolute top-0 bottom-0 w-[1.5px] z-50 transition-none"
            style={{
              left: `${playheadProgress * 100}%`,
              background: 'linear-gradient(180deg, transparent, rgb(var(--accent-glow)) 15%, rgb(var(--accent-glow)) 85%, transparent)',
              boxShadow: '0 0 18px rgb(var(--accent-glow)), 0 0 40px rgb(var(--accent-glow) / 0.5)',
            }}
          >
            {/* End caps */}
            <div className="absolute top-0 -left-1 w-3 h-2 rounded-b-sm" style={{ background: 'rgb(var(--accent-glow))', boxShadow: '0 0 10px rgb(var(--accent-glow))' }}></div>
            <div className="absolute bottom-0 -left-1 w-3 h-2 rounded-t-sm" style={{ background: 'rgb(var(--accent-glow))', boxShadow: '0 0 10px rgb(var(--accent-glow))' }}></div>
          </div>
        </>
      )}
    </div>
  );
};
