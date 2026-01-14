export type Hand = 'R' | 'L' | '-';
export type NoteType = 'normal' | 'accent' | 'ghost' | 'flam' | 'drag';

export interface Note {
  id: string;
  hand: Hand;
  type: NoteType;
  subdivisionIndex: number; // 0 to 15 for 16th notes in 4/4
}

export interface Measure {
  id: number;
  timeSignature: TimeSignature;
  notes: Note[];
}

export interface TimeSignature {
  top: number; // e.g. 4
  bottom: number; // e.g. 4
  name: string;
}

export enum Subdivision {
  Quarter = 4,
  Eighth = 8,
  Sixteenth = 16,
  Triplet = 12, // Treated as 12 positions per beat for math simplifications or 3 per beat
}

export interface Rudiment {
  id: string;
  name: string;
  pattern: (Hand | { hand: Hand; type: NoteType })[];
  defaultSubdivision: Subdivision;
}

export type Theme = 'dark' | 'light';

export interface EngineState {
  isPlaying: boolean;
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;      // Controls the Visual Grid / Rudiment Density
  audioSubdivision: Subdivision; // Controls the Audible Click Track
  selectedRudimentId: string;
  volume: number;
  mirrorMode: boolean;
  showBackgroundVisuals: boolean; // Full screen ambient
  showVisualPanel: boolean;       // Dedicated visualizer panel
  theme: Theme;
}