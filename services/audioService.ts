import { Subdivision, TimeSignature } from '../types';

export interface MeasureBoundaryInfo {
  beatIndex: number; // Usually 0 for measure start
  time: number;      // Exact AudioContext time the beat will occur
  bpm: number;       // The BPM active for this measure
}

class AudioService {
  private ctx: AudioContext | null = null;
  private nextNoteTime: number = 0;
  private isPlaying: boolean = false;
  private timerID: number | undefined;
  
  // Public for visual sync
  public startTime: number = 0;
  private masterVolume: number = 0.8;

  // Schedule settings
  private lookahead = 25.0; // milliseconds
  private scheduleAheadTime = 0.1; // seconds

  // Current session config
  private currentBpm: number = 120;
  private audioSubdivision: Subdivision = Subdivision.Quarter; 
  private currentTimeSignature: TimeSignature = { top: 4, bottom: 4, name: '4/4' };

  // Pending changes (Queued for next measure start)
  private pendingAudioSubdivision: Subdivision | null = null;
  private pendingTimeSignature: TimeSignature | null = null;
  private pendingBpm: number | null = null;
  private pendingBpmAtBeat: boolean = false; // Flag for beat-level BPM changes
  
  // Track position in measure
  private currentNoteNumber = 0; 

  // Callback receives info about the beat being scheduled (Lookahead)
  private onScheduleCallback: ((info: MeasureBoundaryInfo) => void) | null = null;

  constructor() {
    // Lazy init
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setBpm(bpm: number) {
    if (this.isPlaying) {
      // Apply at next beat instead of next measure for faster response
      this.pendingBpm = bpm;
      this.pendingBpmAtBeat = true; // Flag for beat-level change
    } else {
      this.currentBpm = bpm;
      this.pendingBpm = null;
      this.pendingBpmAtBeat = false;
    }
  }

  setAudioSubdivision(sub: Subdivision) {
    if (!this.isPlaying) {
      this.audioSubdivision = sub;
      this.pendingAudioSubdivision = null;
    } else {
      this.pendingAudioSubdivision = sub;
    }
  }

  setTimeSignature(timeSig: TimeSignature) {
    if (!this.isPlaying) {
      this.currentTimeSignature = timeSig;
      this.pendingTimeSignature = null;
    } else {
      this.pendingTimeSignature = timeSig;
    }
  }

  setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  getCurrentTime(): number {
    return this.ctx?.currentTime || 0;
  }

  start(callback: (info: MeasureBoundaryInfo) => void) {
    this.init();
    if (this.isPlaying) return;

    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.onScheduleCallback = callback;
    
    // Reset state for clean start
    this.currentNoteNumber = 0;
    this.pendingAudioSubdivision = null;
    this.pendingTimeSignature = null;
    this.pendingBpm = null;
    this.pendingBpmAtBeat = false;

    // Set start time slightly in the future
    this.startTime = this.ctx!.currentTime + 0.1;
    this.nextNoteTime = this.startTime;
    
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
    }
  }

  private getSlotsPerBeat(): number {
    if (this.currentTimeSignature.bottom === 8) {
      // 6/8 Time
      if (this.audioSubdivision === Subdivision.Sixteenth) return 2;
      if (this.audioSubdivision === Subdivision.Eighth) return 1;
      if (this.audioSubdivision === Subdivision.Triplet) return 3;
      return 2; 
    } else {
      // 4/4 Time
      if (this.audioSubdivision === Subdivision.Sixteenth) return 4;
      if (this.audioSubdivision === Subdivision.Eighth) return 2;
      if (this.audioSubdivision === Subdivision.Triplet) return 3;
      return 1; 
    }
  }

  private nextNote() {
    const slotsPerBeat = this.getSlotsPerBeat();
    const secondsPerBeat = 60.0 / this.currentBpm;
    const secondsPerSlot = secondsPerBeat / slotsPerBeat;

    this.nextNoteTime += secondsPerSlot;
    this.currentNoteNumber++;
  }

  private scheduleNote(time: number) {
    // 1. CALC METADATA FIRST (before applying changes)
    const currentSlotsPerBeat = this.getSlotsPerBeat();
    const beatsPerMeasure = this.currentTimeSignature.top;
    const totalSlots = beatsPerMeasure * currentSlotsPerBeat;
    
    const currentSlotIndex = this.currentNoteNumber % totalSlots;
    const isBeat = currentSlotIndex % currentSlotsPerBeat === 0;
    const beatIndex = Math.floor(currentSlotIndex / currentSlotsPerBeat);
    const isDownbeat = (this.currentNoteNumber % totalSlots) === 0;

    // 2. APPLY PENDING BPM AT BEAT BOUNDARY (faster response)
    if (this.pendingBpm && this.pendingBpmAtBeat && isBeat && this.currentNoteNumber > 0) {
      this.currentBpm = this.pendingBpm;
      this.pendingBpm = null;
      this.pendingBpmAtBeat = false;
    }

    // 3. APPLY OTHER CHANGES AT MEASURE BOUNDARY (time signature, subdivision)
    if (this.currentNoteNumber > 0 && isDownbeat) {
      // Apply pending changes exactly at the measure boundary
      if (this.pendingAudioSubdivision) {
        this.audioSubdivision = this.pendingAudioSubdivision;
        this.pendingAudioSubdivision = null;
      }
      
      if (this.pendingTimeSignature) {
        this.currentTimeSignature = this.pendingTimeSignature;
        this.pendingTimeSignature = null;
      }

      // Apply BPM at measure boundary if it wasn't applied at beat (fallback)
      if (this.pendingBpm && !this.pendingBpmAtBeat) {
        this.currentBpm = this.pendingBpm;
        this.pendingBpm = null;
      }
      
      // Reset counter to keep numbers manageable, though not strictly necessary if Modulo is correct
      // But resetting aligns 0 with Downbeat for the *new* config
      this.currentNoteNumber = 0;
    }

    // 4. RECALCULATE METADATA AFTER POTENTIAL CONFIG CHANGES
    const updatedSlotsPerBeat = this.getSlotsPerBeat();
    const updatedTotalSlots = this.currentTimeSignature.top * updatedSlotsPerBeat;
    
    const updatedSlotIndex = this.currentNoteNumber % updatedTotalSlots;
    const updatedIsBeat = updatedSlotIndex % updatedSlotsPerBeat === 0;
    const updatedBeatIndex = Math.floor(updatedSlotIndex / updatedSlotsPerBeat);

    // 5. SCHEDULE AUDIO
    let freq = 800;
    let gainVal = 0.15 * this.masterVolume;
    let decay = 0.05;

    if (updatedSlotIndex === 0) {
      freq = 1500;
      gainVal = 0.8 * this.masterVolume;
      decay = 0.1;
    } else if (updatedIsBeat) {
      freq = 1000;
      gainVal = 0.4 * this.masterVolume;
    }

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start(time);
    osc.stop(time + decay);

    // 6. NOTIFY UI (Lookahead notification)
    // We notify on every beat, but specifically the Downbeat (beatIndex 0) is crucial for sync
    if (this.onScheduleCallback && updatedIsBeat) {
       this.onScheduleCallback({
         beatIndex: updatedBeatIndex,
         time: time,
         bpm: this.currentBpm
       });
    }
  }

  private scheduler() {
    if (!this.isPlaying) return;

    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime);
      this.nextNote();
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }
}

export const audioService = new AudioService();