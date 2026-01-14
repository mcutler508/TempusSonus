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
  measureVersion: number;
}

export const ScoreConveyor: React.FC<ScoreConveyorProps> = ({
  measure,
  measureSync,
  isPlaying,
  subdivision,
  mirrorMode,
  measureVersion
}) => {
  const [playheadProgress, setPlayheadProgress] = useState(0);
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);
  const requestRef = useRef<number>(0);

  // WE USE REFS FOR ANIMATION LOOP STATE TO AVOID REACT RENDER CYCLE LAG
  // The 'active' params are what is currently being rendered
  const activeParams = useRef<MeasureSyncData>({ startTime: 0, bpm: 100 });
  // The 'next' params are what we will switch to when time reaches nextParams.startTime
  const nextParams = useRef<MeasureSyncData | null>(null);
  
  // Measure transition tracking
  const activeMeasure = useRef<Measure>(measure);
  const nextMeasure = useRef<Measure | null>(null);
  const prevMeasureVersion = useRef<number>(measureVersion);

  // Sync Props to Refs (Lookahead Queue)
  useEffect(() => {
    if (!isPlaying) {
      setPlayheadProgress(0);
      setActiveNoteIndex(-1);
      activeMeasure.current = measure;
      nextMeasure.current = null;
      return;
    }

    const currentTime = audioService.getCurrentTime();

    // If the new sync data is in the future (more than a frame away), queue it
    if (measureSync.startTime > currentTime + 0.02) {
      nextParams.current = measureSync;
    } else {
      // Immediate update (initial start or late arrival)
      activeParams.current = measureSync;
      nextParams.current = null;
    }
  }, [measureSync, isPlaying]);

  // Detect measure structure changes and queue for transition
  useEffect(() => {
    // Check if measure structure actually changed (different note count or time signature)
    const structureChanged = 
      measure.id !== activeMeasure.current.id ||
      measure.notes.length !== activeMeasure.current.notes.length ||
      measure.timeSignature.name !== activeMeasure.current.timeSignature.name ||
      measureVersion !== prevMeasureVersion.current;

    if (structureChanged && isPlaying) {
      // Queue new measure for transition at next beat boundary
      nextMeasure.current = measure;
    } else if (!isPlaying) {
      // If stopped, update immediately
      activeMeasure.current = measure;
      nextMeasure.current = null;
    }

    prevMeasureVersion.current = measureVersion;
  }, [measure, measureVersion, isPlaying]);

  // Animation Loop
  const animate = () => {
    if (!isPlaying) {
      return;
    }

    const currentTime = audioService.getCurrentTime();

    // 1. Check if we need to switch to the queued sync params (Frame Perfect Switch)
    if (nextParams.current && currentTime >= nextParams.current.startTime) {
      activeParams.current = nextParams.current;
      nextParams.current = null;
    }

    // 2. Check if we need to switch to the queued measure at beat boundary
    if (nextMeasure.current) {
      const currentMeasure = activeMeasure.current;
      const slotsPerBeat = currentMeasure.notes.length / currentMeasure.timeSignature.top;
      const measureDuration = getMeasureDuration(activeParams.current.bpm, currentMeasure.timeSignature);
      const elapsed = currentTime - activeParams.current.startTime;
      const safeElapsed = Math.max(0, elapsed);
      const progress = (safeElapsed % measureDuration) / measureDuration;
      const currentSlotIndex = Math.floor(progress * currentMeasure.notes.length);
      const currentBeat = Math.floor(currentSlotIndex / slotsPerBeat);
      const positionInBeat = (currentSlotIndex % slotsPerBeat) / slotsPerBeat;
      
      // Check if we're at the start of a beat (within first 10% of beat) for smooth transition
      const isAtBeatBoundary = positionInBeat < 0.1;
      
      if (isAtBeatBoundary) {
        // Switch to new measure, preserving beat position
        activeMeasure.current = nextMeasure.current;
        nextMeasure.current = null;
        
        // Recalculate start time to maintain visual continuity at current beat
        const newMeasureDuration = getMeasureDuration(activeParams.current.bpm, activeMeasure.current.timeSignature);
        const newBeatProgress = currentBeat / activeMeasure.current.timeSignature.top;
        activeParams.current = {
          ...activeParams.current,
          startTime: currentTime - (newBeatProgress * newMeasureDuration)
        };
      }
    }

    // 3. Calculate Progress based on ACTIVE measure and params
    const currentMeasure = activeMeasure.current;
    const totalNotes = currentMeasure.notes.length;
    const measureDuration = getMeasureDuration(activeParams.current.bpm, currentMeasure.timeSignature);
    const elapsed = currentTime - activeParams.current.startTime;
    
    // We allow negative elapsed (during lookahead pre-roll) but clamp visual to 0
    const safeElapsed = Math.max(0, elapsed);
    
    // Modulo logic handles loop if we haven't received a new start time yet, 
    // though ideally the queue updates exactly on time.
    const progress = (safeElapsed % measureDuration) / measureDuration;
    
    const currentIndex = Math.floor(progress * totalNotes);

    setPlayheadProgress(progress);
    setActiveNoteIndex(currentIndex);

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  // Dynamic Ticks Logic
  // Render ticks between beats based on subdivision
  const renderMicroGrid = () => {
     let ticks = 0;
     if (subdivision === Subdivision.Sixteenth) ticks = 3; // 4 slots -> 3 dividers
     else if (subdivision === Subdivision.Triplet) ticks = 2; // 3 slots -> 2 dividers
     else if (subdivision === Subdivision.Eighth) ticks = 1; // 2 slots -> 1 divider
     
     if (ticks === 0) return null;

     return (
        <div className="absolute inset-0 flex items-center justify-around opacity-20 dark:opacity-10 z-10 pointer-events-none">
           {Array.from({ length: ticks }).map((_, i) => {
              // Highlight middle tick slightly if we have an odd number (center point)
              const isMiddle = (ticks % 2 !== 0) && (i === Math.floor(ticks / 2));
              const heightClass = isMiddle ? "h-3" : "h-2";
              return (
                 <div key={i} className={`w-0.5 ${heightClass} bg-zinc-400 dark:bg-zinc-500 rounded-full`}></div>
              );
           })}
        </div>
     );
  };

  // Helper to render a row of notes
  const renderNoteRow = (type: 'primary' | 'mirror') => {
    const currentMeasure = activeMeasure.current;
    const totalNotes = currentMeasure.notes.length;
    const slotsPerBeat = totalNotes / currentMeasure.timeSignature.top;
    
    return (
      <div className="absolute inset-0 flex items-center px-0 w-full h-full">
        {currentMeasure.notes.map((note, idx) => {
          // Logic for Inversion
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
          
          const widthPct = 100 / totalNotes;
          
          // Determine Style based on Hand
          const isRight = displayHand === 'R';
          
          let colorClass = '';
          if (isRight) {
             // RIGHT HAND (Orange)
             if (isActive) {
                colorClass = `bg-orange-500 text-white dark:bg-orange-600 dark:text-orange-100 shadow-[0_0_25px_rgba(234,88,12,0.6)] ring-1 ring-orange-400`;
             } else {
                colorClass = `bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-800/50`;
             }
          } else {
             // LEFT HAND (Blue)
             if (isActive) {
                colorClass = `bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.6)] ring-1 ring-blue-400`;
             } else {
                colorClass = `bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800/50`;
             }
          }
          
          // --- Subdivision Counting Logic ---
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
              {/* Active Column Highlight (Subtle) */}
              <div 
                className={`absolute inset-0 bg-amber-500/10 dark:bg-amber-500/5 transition-opacity duration-75 ${isActive ? 'opacity-100' : 'opacity-0'}`}
              ></div>

              {!isGhost && (
                <div className={`
                  relative flex items-center justify-center
                  w-12 h-16 rounded-md
                  font-bold text-2xl select-none
                  transition-all duration-75 border
                  ${colorClass}
                  ${!isRight ? 'italic' : ''}
                  ${isAccent ? 'scale-110 z-10 border-black/20 dark:border-white/40' : 'opacity-90'}
                  ${isActive ? 'scale-105 -translate-y-1 brightness-110' : ''}
                  ${type === 'mirror' ? 'opacity-80' : ''}
                `}>
                  {/* Grace Notes */}
                  {isFlam && (
                    <span className="absolute -left-4 top-4 text-sm opacity-70 font-normal text-zinc-500 dark:text-zinc-400">
                      {displayHand === 'R' ? 'l' : 'r'}
                    </span>
                  )}
                  {isDrag && (
                    <span className="absolute -left-5 top-4 text-xs opacity-70 font-normal text-zinc-500 dark:text-zinc-400 tracking-tighter">
                      {displayHand === 'R' ? 'll' : 'rr'}
                    </span>
                  )}
                  
                  {displayHand}

                  {/* Accent Ring */}
                  {isAccent && (
                    <div className={`absolute -inset-1 rounded-lg border ${isActive ? 'border-black/30 dark:border-white/60' : 'border-black/10 dark:border-white/20'}`}></div>
                  )}
                </div>
              )}
              
               {/* Ghost Placeholder */}
               {isGhost && (
                 <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-800 opacity-20"></div>
               )}

               {/* Sticking/Counting Text Below (Primary Only) */}
               {type === 'primary' && (
                 <span className={`absolute -bottom-8 text-[10px] font-mono font-bold tracking-wider transition-colors uppercase ${isActive ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-400 dark:text-zinc-600 opacity-70'}`}>
                   {subText}
                 </span>
               )}
            </div>
          );
        })}
      </div>
    );
  };

  const currentMeasure = activeMeasure.current;
  
  return (
    <div className="relative w-full max-w-5xl h-64 bg-white dark:bg-zinc-950/50 border-y border-zinc-200 dark:border-zinc-800 backdrop-blur-sm select-none overflow-hidden rounded-xl mx-4 shadow-xl dark:shadow-2xl transition-all duration-500">
      
      {/* 1. THE STATIONARY GRID (Shared) */}
      <div className="absolute inset-0 flex w-full h-full pointer-events-none">
        {Array.from({ length: currentMeasure.timeSignature.top }).map((_, i) => (
          <div 
            key={`beat-${i}`} 
            className="flex-1 border-r border-zinc-200 dark:border-zinc-800/60 h-full last:border-r-0 relative group"
          >
            {/* Beat Marker - Large Background Number */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
               <span className="text-[8rem] leading-none font-black text-zinc-100 dark:text-white/[0.03] select-none pointer-events-none translate-y-2">
                 {i + 1}
               </span>
            </div>

            {/* Micro Grid (Always On) */}
            {renderMicroGrid()}
            
            {/* Corner Label (Smaller backup) */}
            <span className="absolute top-2 left-3 text-[10px] font-bold text-zinc-300 dark:text-zinc-700 select-none tracking-widest uppercase">
              Beat {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* 2. NOTES CONTAINER */}
      <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 z-20 ${mirrorMode ? 'gap-10' : 'gap-0'}`}>
        
        {/* PRIMARY ROW */}
        <div className={`relative w-full h-20 transition-all duration-500 ${mirrorMode ? '-translate-y-4' : 'translate-y-0'}`}>
          <div className={`absolute -left-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 dark:text-zinc-600 font-mono -rotate-90 origin-right whitespace-nowrap transition-opacity duration-500 ${mirrorMode ? 'opacity-50' : 'opacity-0'}`}>
            PRIMARY
          </div>
          {renderNoteRow('primary')}
        </div>

        {/* MIRROR ROW */}
        <div className={`relative w-full h-20 transition-all duration-500 ${mirrorMode ? 'opacity-100 translate-y-2' : 'opacity-0 translate-y-10 pointer-events-none absolute bottom-0'}`}>
           <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 dark:text-zinc-600 font-mono -rotate-90 origin-right whitespace-nowrap opacity-50">
             INVERTED
           </div>
           {renderNoteRow('mirror')}
        </div>

      </div>

      {/* 3. PLAYHEAD OVERLAY (Shared) */}
      <div 
         className={`absolute top-0 bottom-0 w-0.5 bg-amber-500 dark:bg-amber-400 z-50 shadow-[0_0_15px_#f59e0b] transition-none ${!isPlaying ? 'opacity-0' : 'opacity-100'}`}
         style={{ left: `${playheadProgress * 100}%` }}
      >
        <div className="absolute top-0 -left-1.5 w-4 h-2 bg-amber-500 dark:bg-amber-400 rounded-b-sm"></div>
        <div className="absolute bottom-0 -left-1.5 w-4 h-2 bg-amber-500 dark:bg-amber-400 rounded-t-sm"></div>
        <div className="absolute inset-y-0 -left-px w-1 bg-amber-500 blur-sm"></div>
      </div>

    </div>
  );
};