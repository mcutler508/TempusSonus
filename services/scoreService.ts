const STORAGE_KEY = 'tempussonus_stats_v1';

export interface UserStats {
  peakCleanBPM: number;
  longestSessionMinutes: number;
  stabilityHistory: number[]; // Rolling history for average
  sessionDates: string[]; // ISO Date strings to track unique days
  currentScore: number;
  previousScore: number;
}

const DEFAULT_STATS: UserStats = {
  peakCleanBPM: 0,
  longestSessionMinutes: 0,
  stabilityHistory: [],
  sessionDates: [],
  currentScore: 0,
  previousScore: 0
};

export const scoreService = {
  loadStats: (): UserStats => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  },

  calculateScore: (stats: UserStats): number => {
    // 1. Average Stability (Last 50 sessions)
    // Default to 0 if no history
    const avgStability = stats.stabilityHistory.length > 0
      ? stats.stabilityHistory.reduce((a, b) => a + b, 0) / stats.stabilityHistory.length
      : 0;

    // 2. Active Days (Last 30 Days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const uniqueDays = new Set(
      stats.sessionDates
        .filter(dateStr => new Date(dateStr).getTime() > thirtyDaysAgo)
        .map(dateStr => new Date(dateStr).toDateString())
    );
    const activeDaysLast30 = uniqueDays.size;

    // 3. Formula Components
    // peakCleanBPM / 200 * 0.35 (Cap BPM effect at 220)
    const bpmScore = (Math.min(stats.peakCleanBPM, 220) / 200) * 0.35;
    
    // longestSessionMinutes / 20 * 0.25 (Cap at 40 mins for max points)
    const enduranceScore = (Math.min(stats.longestSessionMinutes, 40) / 20) * 0.25;
    
    // avgStability / 100 * 0.20
    const stabilityScore = (avgStability / 100) * 0.20;
    
    // activeDaysLast30 / 30 * 0.20
    const consistencyScore = (Math.min(activeDaysLast30, 30) / 30) * 0.20;

    const rawScore = (bpmScore + enduranceScore + stabilityScore + consistencyScore) * 100;
    
    return Math.min(100, Math.round(rawScore));
  },

  /**
   * Records a completed or stopped session.
   * @param bpm The tempo of the session
   * @param durationSeconds Total duration of the session
   */
  recordSession: (bpm: number, durationSeconds: number): UserStats => {
    // Ignore sessions shorter than 30 seconds to prevent stat spamming
    if (durationSeconds < 30) {
      return scoreService.loadStats();
    }

    const stats = scoreService.loadStats();
    const durationMinutes = durationSeconds / 60;
    const now = new Date();

    // Update Peak BPM (Require > 1 min duration to count as "Clean" at this tempo)
    if (durationSeconds > 60 && bpm > stats.peakCleanBPM) {
      stats.peakCleanBPM = bpm;
    }

    // Update Longest Session
    if (durationMinutes > stats.longestSessionMinutes) {
      stats.longestSessionMinutes = parseFloat(durationMinutes.toFixed(2));
    }

    // Update Stability History
    // Since we don't have mic input, we reward 'Discipline' (completion).
    // A completed session > 30s counts as 100% stability for now.
    stats.stabilityHistory.push(100);
    if (stats.stabilityHistory.length > 50) {
      stats.stabilityHistory.shift();
    }

    // Update Active Days
    stats.sessionDates.push(now.toISOString());
    // Cleanup old dates (keep last 60 days to be safe)
    const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    stats.sessionDates = stats.sessionDates.filter(d => new Date(d).getTime() > sixtyDaysAgo);

    // Calculate New Score
    const newScore = scoreService.calculateScore(stats);
    
    // Only update previous score if it changed
    if (newScore !== stats.currentScore) {
      stats.previousScore = stats.currentScore;
      stats.currentScore = newScore;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    return stats;
  }
};