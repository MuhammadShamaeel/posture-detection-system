// ─── Scoring weights (must sum to 1.0) 
const WEIGHTS = {
  forwardZ : 0.30,
  neck     : 0.20,
  headY    : 0.20,
  lateral  : 0.15,
  shoulder : 0.15,
};

// ─── Dead zones
const DEAD_ZONE = {
  forwardZ : 0.04,
  lateral  : 0.04,
  shoulder : 0.03,
  neck     : 3,
  headY    : 0.03,
};

// ─── Zone thresholds 
const ZONE_THRESHOLD = { RED: 1.8, YELLOW: 0.8 };

// ─── Hysteresis delays (ms) 
const HYSTERESIS = {
  GREEN_TO_YELLOW : 1200,
  GREEN_TO_RED    : 1800,
  YELLOW_TO_RED   : 1500,
  YELLOW_TO_GREEN : 1200,
  RED_TO_YELLOW   : 1200,
  RED_TO_GREEN    : 1800,
};

const SCORE_BUFFER_SIZE = 10;

// ─── Temporal analysis config 
// We snapshot the current avgScore once per second into a ring buffer.
// TREND_WINDOW = how many seconds of history to analyse.
// DEGRADATION_THRESHOLD = how much the score must rise over the window to
//   count as "degrading" (drift upward in badness).
const TREND_WINDOW           = 30;   // seconds of history
const DEGRADATION_THRESHOLD  = 0.25; // score rise that signals degradation
const IMPROVEMENT_THRESHOLD  = 0.20; // score drop that signals improvement
const SNAPSHOT_INTERVAL_MS   = 1000; // one snapshot per second

// ─── Drift detection config 
// EMA smoothing factor (0–1). Lower = slower, smoother response.
const EMA_ALPHA = 0.05;

// Per-axis drift thresholds — deviation EMA must exceed these to flag drift.
const DRIFT_THRESHOLD = {
  forwardLean       : 0.06,
  headDrop          : 0.05,
  neckTilt          : 4,     // degrees
  lateralTilt       : 0.05,
  shoulderImbalance : 0.04,
};

// ─── PSI config 
// PSI = 100 − penalty. Three components:
//   avgScore penalty   (0–60 pts)   how bad is the current posture
//   stability penalty  (0–25 pts)   variance of score buffer (flicker = unstable)
//   streak penalty     (0–15 pts)   how long has poor posture lasted
const PSI_SCORE_WEIGHT     = 60;
const PSI_STABILITY_WEIGHT = 25;
const PSI_STREAK_WEIGHT    = 15;
const PSI_MAX_STREAK_S     = 120; // streak beyond this = max penalty

// ─── Labels 
export const POSTURE_LABEL = {
  GREEN  : "Good Posture",
  YELLOW : "Adjust Posture",
  RED    : "Poor Posture",
};

export const TREND_LABEL = {
  STABLE    : "Stable",
  DEGRADING : "Degrading",
  IMPROVING : "Improving",
};

export class PostureDetector {
  constructor() {
    // ── Per-frame state 
    this.scoreBuffer   = [];
    this.currentZone   = "GREEN";
    this.displayZone   = "GREEN";
    this.zoneStartTime = Date.now();
    this.lastAvgScore  = 0;

    // ── Session stats 
    this.sessionFrames       = 0;
    this.goodFrames          = 0;
    this.poorPostureStart    = null;
    this.poorPostureDuration = 0;

    // ── Temporal analysis 
    // Ring buffer: each entry is { score, zone, ts }
    this.history          = [];
    this.lastSnapshotTime = Date.now();

    // ── Drift detection 
    // EMA of each raw deviation axis
    this.ema = {
      forwardLean       : 0,
      headDrop          : 0,
      neckTilt          : 0,
      lateralTilt       : 0,
      shoulderImbalance : 0,
    };

    // ── PSI 
    this.psi = 100;

    // ── Trend 
    this.trend = "STABLE";
  }

  // ─── Reset (called on stop / recalibrate) 
  reset() {
    this.scoreBuffer         = [];
    this.currentZone         = "GREEN";
    this.displayZone         = "GREEN";
    this.zoneStartTime       = Date.now();
    this.lastAvgScore        = 0;
    this.sessionFrames       = 0;
    this.goodFrames          = 0;
    this.poorPostureStart    = null;
    this.poorPostureDuration = 0;
    this.history             = [];
    this.lastSnapshotTime    = Date.now();
    this.ema = { forwardLean: 0, headDrop: 0, neckTilt: 0, lateralTilt: 0, shoulderImbalance: 0 };
    this.psi   = 100;
    this.trend = "STABLE";
  }

  // ─── Main detect — called every MediaPipe frame (~30fps) 
  detect(baseline, features) {
    if (!baseline) return "Waiting for calibration...";

    const now = Date.now();

    // ── 1. Raw deviations from personal baseline 
    let forward_dev  = features.forwardHeadZ - baseline.forwardHeadZ;
    let lateral_dev  = features.headOffsetX  - baseline.headOffsetX;
    let shoulder_dev = features.shoulderTilt - baseline.shoulderTilt;
    let neck_dev     = features.neckAngle    - baseline.neckAngle;
    let headY_dev    = features.forwardHeadY - baseline.forwardHeadY;

    // ── 2. Drift detection: update EMA with raw deviations 
    this._updateEMA({
      forwardLean       : forward_dev,
      headDrop          : headY_dev,
      neckTilt          : neck_dev,
      lateralTilt       : lateral_dev,
      shoulderImbalance : shoulder_dev,
    });

    // ── 3. Apply dead zones (scoring only, not EMA) 
    if (Math.abs(forward_dev)  < DEAD_ZONE.forwardZ)  forward_dev  = 0;
    if (Math.abs(lateral_dev)  < DEAD_ZONE.lateral)   lateral_dev  = 0;
    if (Math.abs(shoulder_dev) < DEAD_ZONE.shoulder)  shoulder_dev = 0;
    if (Math.abs(neck_dev)     < DEAD_ZONE.neck)      neck_dev     = 0;
    if (Math.abs(headY_dev)    < DEAD_ZONE.headY)     headY_dev    = 0;

    // ── 4. Component scores 
    const forwardScore  = Math.max(0, forward_dev  * 10);
    const headYScore    = Math.max(0, headY_dev    * 8);
    const neckScore     = Math.max(0, neck_dev     / 8);
    const lateralScore  = Math.abs(lateral_dev)    * 6;
    const shoulderScore = Math.abs(shoulder_dev)   * 8;

    let score =
      WEIGHTS.forwardZ * forwardScore  +
      WEIGHTS.neck     * neckScore     +
      WEIGHTS.headY    * headYScore    +
      WEIGHTS.lateral  * lateralScore  +
      WEIGHTS.shoulder * shoulderScore;

    score = Math.min(score, 3);

    // ── 5. Temporal smoothing (rolling avg) 
    this.scoreBuffer.push(score);
    if (this.scoreBuffer.length > SCORE_BUFFER_SIZE) this.scoreBuffer.shift();

    const avgScore =
      this.scoreBuffer.reduce((a, b) => a + b, 0) / this.scoreBuffer.length;

    this.lastAvgScore = avgScore;

    // ── 6. Zone classification 
    let instantZone = "GREEN";
    if      (avgScore >= ZONE_THRESHOLD.RED)    instantZone = "RED";
    else if (avgScore >= ZONE_THRESHOLD.YELLOW) instantZone = "YELLOW";

    // ── 7. Hysteresis 
    if (instantZone !== this.currentZone) {
      this.currentZone   = instantZone;
      this.zoneStartTime = now;
    }
    this._applyHysteresis(now - this.zoneStartTime);

    // ── 8. Session stats 
    this.sessionFrames++;
    if (this.displayZone === "GREEN") {
      this.goodFrames++;
      this.poorPostureStart    = null;
      this.poorPostureDuration = 0;
    } else {
      if (!this.poorPostureStart) this.poorPostureStart = now;
      this.poorPostureDuration = Math.floor((now - this.poorPostureStart) / 1000);
    }

    // ── 9. Temporal snapshot (once per second) 
    if (now - this.lastSnapshotTime >= SNAPSHOT_INTERVAL_MS) {
      this._takeSnapshot(avgScore, now);
      this.lastSnapshotTime = now;
    }

    // ── 10. PSI (recalculated every frame, cheap) 
    this._updatePSI(avgScore);

    return POSTURE_LABEL[this.displayZone];
  }

  // ─── Hysteresis state machine 
  _applyHysteresis(elapsed) {
    if (this.displayZone === "GREEN") {
      if (this.currentZone === "YELLOW" && elapsed > HYSTERESIS.GREEN_TO_YELLOW)
        this.displayZone = "YELLOW";
      if (this.currentZone === "RED"    && elapsed > HYSTERESIS.GREEN_TO_RED)
        this.displayZone = "RED";
    } else if (this.displayZone === "YELLOW") {
      if (this.currentZone === "RED"    && elapsed > HYSTERESIS.YELLOW_TO_RED)
        this.displayZone = "RED";
      if (this.currentZone === "GREEN"  && elapsed > HYSTERESIS.YELLOW_TO_GREEN)
        this.displayZone = "GREEN";
    } else if (this.displayZone === "RED") {
      if (this.currentZone === "YELLOW" && elapsed > HYSTERESIS.RED_TO_YELLOW)
        this.displayZone = "YELLOW";
      if (this.currentZone === "GREEN"  && elapsed > HYSTERESIS.RED_TO_GREEN)
        this.displayZone = "GREEN";
    }
  }

  // ─── EMA update for drift detection 
  _updateEMA(rawDevs) {
    for (const key of Object.keys(this.ema)) {
      const raw = rawDevs[key] ?? 0;
      // EMA formula: ema = ema + alpha * (raw - ema)
      this.ema[key] = this.ema[key] + EMA_ALPHA * (raw - this.ema[key]);
    }
  }

  // ─── Snapshot ring buffer for temporal analysis 
  _takeSnapshot(avgScore, ts) {
    this.history.push({ score: avgScore, zone: this.displayZone, ts });
    // Keep only the last TREND_WINDOW snapshots
    if (this.history.length > TREND_WINDOW) this.history.shift();

    // Trend: compare avg score of first half vs second half of history
    if (this.history.length >= 10) {
      const mid   = Math.floor(this.history.length / 2);
      const first = this.history.slice(0, mid);
      const last  = this.history.slice(mid);

      const avgFirst = first.reduce((s, h) => s + h.score, 0) / first.length;
      const avgLast  = last.reduce((s,  h) => s + h.score, 0) / last.length;
      const delta    = avgLast - avgFirst;

      if      (delta >  DEGRADATION_THRESHOLD)  this.trend = "DEGRADING";
      else if (delta < -IMPROVEMENT_THRESHOLD)  this.trend = "IMPROVING";
      else                                       this.trend = "STABLE";
    }
  }

  // ─── PSI calculation 
  _updatePSI(avgScore) {
    // Score penalty: 0 score → 0 penalty, score=3 → full PSI_SCORE_WEIGHT penalty
    const scorePenalty = (avgScore / 3) * PSI_SCORE_WEIGHT;

    // Stability penalty: variance of scoreBuffer
    const mean = avgScore;
    const variance =
      this.scoreBuffer.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
      Math.max(this.scoreBuffer.length, 1);
    // Max expected variance ~0.5, clamp at 1
    const stabilityPenalty = Math.min(variance / 0.5, 1) * PSI_STABILITY_WEIGHT;

    // Streak penalty: how long in poor posture (up to PSI_MAX_STREAK_S)
    const streakPenalty =
      (Math.min(this.poorPostureDuration, PSI_MAX_STREAK_S) / PSI_MAX_STREAK_S) *
      PSI_STREAK_WEIGHT;

    this.psi = Math.max(
      0,
      Math.round(100 - scorePenalty - stabilityPenalty - streakPenalty)
    );
  }

  // ─── Public getters 

  getSessionStats() {
    if (this.sessionFrames === 0) return { goodPercent: 0, poorDuration: 0 };
    return {
      goodPercent  : Math.round((this.goodFrames / this.sessionFrames) * 100),
      poorDuration : this.poorPostureDuration,
    };
  }

  /**
   * Returns the full analysis object consumed by usePostureAnalysis hook.
   * @returns {{
   *   psi: number,           0–100, higher = better
   *   trend: string,         STABLE | DEGRADING | IMPROVING
   *   driftAxes: string[],   axis keys currently drifting beyond threshold
   *   historyWindow: number  how many seconds of history we have
   * }}
   */
  getAnalysis() {
    // Which axes have EMA drifted beyond their threshold?
    const driftAxes = Object.keys(DRIFT_THRESHOLD).filter(
      (key) => Math.abs(this.ema[key]) > DRIFT_THRESHOLD[key]
    );

    return {
      psi           : this.psi,
      trend         : this.trend,
      driftAxes,
      historyWindow : this.history.length, // seconds of data collected
    };
  }
}