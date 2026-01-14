import { Rudiment, Subdivision, TimeSignature } from './types';

export const TIME_SIGNATURES: TimeSignature[] = [
  { top: 4, bottom: 4, name: '4/4' },
  { top: 3, bottom: 4, name: '3/4' },
  { top: 6, bottom: 8, name: '6/8' },
];

export const SUBDIVISIONS = [
  { value: Subdivision.Eighth, label: '8ths' },
  { value: Subdivision.Triplet, label: 'Triplets' },
  { value: Subdivision.Sixteenth, label: '16ths' },
];

export const RUDIMENTS: Rudiment[] = [
  // --- LEVEL 1 ---
  {
    id: 'single_stroke_roll',
    name: 'Single Stroke',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: ['R', 'L'],
  },
  {
    id: 'double_stroke_roll',
    name: 'Double Stroke',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: ['R', 'R', 'L', 'L'],
  },
  
  // --- LEVEL 2 ---
  {
    id: 'single_paradiddle',
    name: 'Paradiddle',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: [
      { hand: 'R', type: 'accent' }, 'L', 'R', 'R',
      { hand: 'L', type: 'accent' }, 'R', 'L', 'L'
    ],
  },
  {
    id: 'flam',
    name: 'Flam',
    defaultSubdivision: Subdivision.Quarter, // Usually practiced with space
    pattern: [
      { hand: 'R', type: 'flam' }, 
      { hand: 'L', type: 'flam' }
    ],
  },
  {
    id: 'drag',
    name: 'Drag',
    defaultSubdivision: Subdivision.Quarter,
    pattern: [
      { hand: 'R', type: 'drag' },
      { hand: 'L', type: 'drag' }
    ],
  },

  // --- LEVEL 3 ---
  {
    id: 'double_paradiddle',
    name: 'Dbl Paradiddle',
    defaultSubdivision: Subdivision.Sixteenth, // Often 6/8 but mapped to 16ths here as per req
    pattern: [
      { hand: 'R', type: 'accent' }, 'L', 'R', 'L', 'R', 'R',
      { hand: 'L', type: 'accent' }, 'R', 'L', 'R', 'L', 'L'
    ],
  },
  {
    id: 'triple_paradiddle',
    name: 'Trp Paradiddle',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: [
      { hand: 'R', type: 'accent' }, 'L', 'R', 'L', 'R', 'L', 'R', 'R',
      { hand: 'L', type: 'accent' }, 'R', 'L', 'R', 'L', 'R', 'L', 'L'
    ],
  },
  {
    id: 'flam_accent',
    name: 'Flam Accent',
    defaultSubdivision: Subdivision.Triplet,
    pattern: [
      { hand: 'R', type: 'flam' }, 'L', 'R',
      { hand: 'L', type: 'flam' }, 'R', 'L'
    ],
  },
  {
    id: 'flam_tap',
    name: 'Flam Tap',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: [
      { hand: 'R', type: 'flam' }, 'R',
      { hand: 'L', type: 'flam' }, 'L'
    ],
  },
  {
    id: 'single_drag_tap',
    name: 'Sgl Drag Tap',
    defaultSubdivision: Subdivision.Sixteenth, // 2 notes? No, Drag + Tap. Usually triplet shuffle or 16th.
    pattern: [
      { hand: 'R', type: 'drag' }, 'L',
      { hand: 'L', type: 'drag' }, 'R'
    ],
  },

  // --- LEVEL 4 ---
  {
    id: 'paradiddle_diddle',
    name: 'Para-Diddle',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: [
      { hand: 'R', type: 'accent' }, 'L', 'R', 'R', 'L', 'L',
      { hand: 'L', type: 'accent' }, 'R', 'L', 'L', 'R', 'R'
    ],
  },
  {
    id: 'double_drag_tap',
    name: 'Dbl Drag Tap',
    defaultSubdivision: Subdivision.Sixteenth, // Drag R L, Drag L R
    pattern: [
      { hand: 'R', type: 'drag' }, 'R', 'L',
      { hand: 'L', type: 'drag' }, 'L', 'R'
    ],
  },
  {
    id: 'lesson_25',
    name: 'Lesson 25',
    defaultSubdivision: Subdivision.Sixteenth,
    // Input provided: R L R R L R L L. (This is a sticking variation provided in prompt)
    pattern: [
      { hand: 'R', type: 'accent' }, 'L', 'R', 'R', 
      { hand: 'L', type: 'accent' }, 'R', 'L', 'L'
    ], 
    // Correction: The user prompt specified "R L R R L R L L" for Lesson 25. 
    // This is identical to a standard paradiddle in sticking, but usually phrasing differs.
    // I will use the prompt's provided cells literally, assuming they want this sticking.
  },
  {
    id: 'single_ratamacue',
    name: 'Sgl Ratamacue',
    defaultSubdivision: Subdivision.Triplet,
    pattern: [
      { hand: 'R', type: 'drag' }, 'L', 'R', { hand: 'L', type: 'drag' }, 'R', 'L'
      // Ratamacue is 4 notes: Drag L R L. 
      // Input cells: "D R L R", "D L R L"
      // Wait, D R L R is 3 notes if Drag is grace. 
      // D(grace) R(main) L(main) R(main).
      // Triplet feel: 1-trip-let.
      // We map 3 main notes to the triplet grid. The drag is visual grace.
    ],
  },
  {
    id: 'herta',
    name: 'Herta',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: [
      { hand: 'R', type: 'accent' }, 'R', 'L', 'R',
      { hand: 'L', type: 'accent' }, 'L', 'R', 'L'
    ],
  },
  {
    id: 'inverted_double_stroke',
    name: 'Inv Double',
    defaultSubdivision: Subdivision.Sixteenth,
    pattern: [
      { hand: 'R', type: 'accent' }, 'R', 'L', 'L', 'R', 'L',
      { hand: 'L', type: 'accent' }, 'L', 'R', 'R', 'L', 'R'
    ],
  },

  // --- LEVEL 5 ---
  {
    id: 'double_ratamacue',
    name: 'Dbl Ratamacue',
    defaultSubdivision: Subdivision.Triplet,
    // Drag R L R L R (5 notes? No, D + 4 notes? No.)
    // Standard: Drag, R, L, Drag, R, L, R. 
    // Input cells: "D R L R L R", "D L R L R L"
    // This looks like Drag + 5 notes.
    pattern: [
      { hand: 'R', type: 'drag' }, 'L', 'R', 'L', 'R',
      { hand: 'L', type: 'drag' }, 'R', 'L', 'R', 'L'
    ],
  },
  {
    id: 'triple_ratamacue',
    name: 'Trp Ratamacue',
    defaultSubdivision: Subdivision.Triplet,
    // Input: "D R L R L R L R"
    pattern: [
      { hand: 'R', type: 'drag' }, 'L', 'R', 'L', 'R', 'L', 'R',
      { hand: 'L', type: 'drag' }, 'R', 'L', 'R', 'L', 'R', 'L'
    ],
  }
];