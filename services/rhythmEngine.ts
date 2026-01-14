import { Measure, Note, Rudiment, Subdivision, TimeSignature, NoteType } from '../types';
import { RUDIMENTS } from '../constants';

/**
 * Generates a full measure of notes based on the time signature, 
 * subdivision, and selected rudiment.
 */
export const generateMeasure = (
  timeSig: TimeSignature,
  subdivision: Subdivision,
  rudimentId: string
): Measure => {
  const rudiment = RUDIMENTS.find((r) => r.id === rudimentId) || RUDIMENTS[0];
  
  // Calculate total "slots" in the measure
  // e.g. 4/4 with 16ths = 16 slots.
  // 6/8 with 16ths: (6 beats / 8 value) * 16 subdiv = 12 slots
  
  let slotsPerBeat = 0;
  if (subdivision === Subdivision.Sixteenth) slotsPerBeat = 4;
  else if (subdivision === Subdivision.Triplet) slotsPerBeat = 3;
  else if (subdivision === Subdivision.Eighth) slotsPerBeat = 2;
  
  // Adjust for time signature bottom (denominator)
  // If bottom is 8 (6/8), an 8th note is the beat unit.
  // If bottom is 4 (4/4), a quarter note is the beat unit.
  
  let totalSlots = 0;
  if (timeSig.bottom === 4) {
    totalSlots = timeSig.top * slotsPerBeat;
  } else if (timeSig.bottom === 8) {
    // In 6/8, there are 6 eighth notes.
    // If subdivision is 16th, that's 2 per eighth note => 12 slots.
    if (subdivision === Subdivision.Sixteenth) totalSlots = timeSig.top * 2;
    else if (subdivision === Subdivision.Eighth) totalSlots = timeSig.top;
    else if (subdivision === Subdivision.Triplet) totalSlots = timeSig.top * 3; // fast triplets
  }

  const notes: Note[] = [];
  const patternLength = rudiment.pattern.length;

  for (let i = 0; i < totalSlots; i++) {
    // Cycle through the rudiment pattern
    const patternItem = rudiment.pattern[i % patternLength];
    
    let hand: 'R' | 'L' | '-' = 'R';
    let type: NoteType = 'normal';

    if (typeof patternItem === 'string') {
      hand = patternItem;
    } else {
      hand = patternItem.hand;
      type = patternItem.type;
    }

    notes.push({
      id: `note-${i}`,
      hand,
      type,
      subdivisionIndex: i,
    });
  }

  return {
    id: Date.now(),
    timeSignature: timeSig,
    notes,
  };
};

/**
 * Calculates the duration of one measure in seconds for CSS animation
 */
export const getMeasureDuration = (bpm: number, timeSig: TimeSignature): number => {
  // Beats per minute.
  // Seconds per beat = 60 / BPM.
  const secondsPerBeat = 60 / bpm;
  return secondsPerBeat * timeSig.top;
};