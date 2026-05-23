// ─── This file now uses ML predictions from backend ───

import { predictPostureML } from "../../services/sessionService";

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

// ─── Configuration ──────────────────────────────────────────────────────────
const PREDICTION_BUFFER_SIZE = 5;  // Smooth predictions over last N frames
const MAX_API_RETRIES = 3;

export class PostureDetector {
  constructor() {
    // ── State 
    this.currentZone = "GREEN";
    this.displayZone = "GREEN";
    this.predictionBuffer = [];
    this.lastApiCallTime = 0;
    this.apiCallInProgress = false;
    this.apiRetryCount = 0;
    
    // ── Session stats 
    this.sessionFrames = 0;
    this.goodFrames = 0;
    this.poorPostureStart = null;
    this.poorPostureDuration = 0;
    
    // ── Temporal analysis 
    this.history = [];
    this.lastSnapshotTime = Date.now();
    
    // ── PSI 
    this.psi = 100;
    
    // ── Trend 
    this.trend = "STABLE";
    this.lastMLPrediction = null;
    this.lastFeatures = null;
  }

  // ─── Reset 
  reset() {
    this.currentZone = "GREEN";
    this.displayZone = "GREEN";
    this.predictionBuffer = [];
    this.sessionFrames = 0;
    this.goodFrames = 0;
    this.poorPostureStart = null;
    this.poorPostureDuration = 0;
    this.history = [];
    this.lastSnapshotTime = Date.now();
    this.psi = 100;
    this.trend = "STABLE";
    this.lastMLPrediction = null;
    this.apiRetryCount = 0;
    this.apiCallInProgress = false;
  }

  // ─── Convert posture features to ML model format ────────────────────────
  _prepareMLFeatures(features) {
    // Map the features from your frontend to the exact column names your model expects
    // Based on your health check output: 
    // ["Age","Repetition_Number","Accel_X","Accel_Y","Accel_Z","Gyro_X","Gyro_Y","Gyro_Z","Knee_Angle","Elbow_Angle","Stability_Metric"]
    
    return {
      'Age': features.age || 25,
      'Repetition_Number': features.repetitionNumber || this.sessionFrames || 0,
      'Accel_X': features.accelX || 0,
      'Accel_Y': features.accelY || 0,
      'Accel_Z': features.accelZ || 0,
      'Gyro_X': features.gyroX || 0,
      'Gyro_Y': features.gyroY || 0,
      'Gyro_Z': features.gyroZ || 0,
      'Knee_Angle': features.kneeAngle || 120,
      'Elbow_Angle': features.elbowAngle || 90,
      'Stability_Metric': features.stabilityMetric || 0.5,
    };
  }

  // ─── Call ML API for prediction ───────────────────────────────────────────
  async _callMLPrediction(features) {
    if (this.apiCallInProgress) return null;
    
    const now = Date.now();
    // Rate limit: max 5 calls per second (200ms between calls)
    if (now - this.lastApiCallTime < 200) return null;
    
    this.apiCallInProgress = true;
    this.lastApiCallTime = now;
    
    try {
      const mlFeatures = this._prepareMLFeatures(features);
      const result = await predictPostureML(mlFeatures);
      
      if (result.status === 'success') {
        this.apiRetryCount = 0;
        return result;
      } else {
        throw new Error(result.error || 'Prediction failed');
      }
    } catch (error) {
      console.warn('ML Prediction failed, falling back to rule-based:', error);
      
      if (this.apiRetryCount < MAX_API_RETRIES) {
        this.apiRetryCount++;
      }
      return null;
    } finally {
      this.apiCallInProgress = false;
    }
  }

  // ─── Rule-based fallback scoring (if ML is unavailable) ──────────────────────
  _calculateRuleBasedScore(features, baseline) {
    if (!baseline) return 0;
    
    let forward_dev = features.forwardHeadZ - baseline.forwardHeadZ;
    let lateral_dev = features.headOffsetX - baseline.headOffsetX;
    let shoulder_dev = features.shoulderTilt - baseline.shoulderTilt;
    let neck_dev = features.neckAngle - baseline.neckAngle;
    
    const WEIGHTS = {
      forwardZ: 0.30,
      neck: 0.20,
      lateral: 0.15,
      shoulder: 0.15,
    };
    
    const forwardScore = Math.max(0, forward_dev * 10);
    const neckScore = Math.max(0, neck_dev / 8);
    const lateralScore = Math.abs(lateral_dev) * 6;
    const shoulderScore = Math.abs(shoulder_dev) * 8;
    
    let score = WEIGHTS.forwardZ * forwardScore +
                WEIGHTS.neck * neckScore +
                WEIGHTS.lateral * lateralScore +
                WEIGHTS.shoulder * shoulderScore;
    
    return Math.min(score, 3);
  }

  // ─── Update zone based on ML prediction ───────────────────────────────────
  _updateZoneFromML(predictionResult) {
    if (!predictionResult) return null;
    
    // Use the zone directly from your backend response
    if (predictionResult.zone === 'GREEN') return 'GREEN';
    if (predictionResult.zone === 'YELLOW') return 'YELLOW';
    if (predictionResult.zone === 'RED') return 'RED';
    
    // Fallback: determine zone from confidence
    if (predictionResult.prediction === 0) {
      return 'GREEN';
    } else {
      const badConfidence = predictionResult.confidence?.bad || 0;
      return badConfidence > 0.7 ? 'RED' : 'YELLOW';
    }
  }

  // ─── Smooth predictions with buffer ───────────────────────────────────────
  _smoothZone(newZone) {
    this.predictionBuffer.push(newZone);
    if (this.predictionBuffer.length > PREDICTION_BUFFER_SIZE) {
      this.predictionBuffer.shift();
    }
    
    // Return most common zone in buffer
    const zoneCounts = {
      GREEN: this.predictionBuffer.filter(z => z === 'GREEN').length,
      YELLOW: this.predictionBuffer.filter(z => z === 'YELLOW').length,
      RED: this.predictionBuffer.filter(z => z === 'RED').length,
    };
    
    return Object.keys(zoneCounts).reduce((a, b) => 
      zoneCounts[a] > zoneCounts[b] ? a : b
    );
  }

  // ─── Main detect method (async now) ───────────────────────────────────────
  async detect(baseline, features) {
    if (!baseline) return "Waiting for calibration...";
    
    const now = Date.now();
    let mlResult = null;
    let zone = null;
    
    // Try to get ML prediction
    mlResult = await this._callMLPrediction(features);
    
    if (mlResult) {
      // ML prediction succeeded
      zone = this._updateZoneFromML(mlResult);
      this.lastMLPrediction = mlResult;
    } else {
      // Fallback to rule-based scoring
      const ruleScore = this._calculateRuleBasedScore(features, baseline);
      
      if (ruleScore >= 1.8) zone = 'RED';
      else if (ruleScore >= 0.8) zone = 'YELLOW';
      else zone = 'GREEN';
    }
    
    // Apply smoothing
    const smoothedZone = this._smoothZone(zone);
    this.currentZone = smoothedZone;
    
    // Update session stats
    this.sessionFrames++;
    if (smoothedZone === 'GREEN') {
      this.goodFrames++;
      this.poorPostureStart = null;
      this.poorPostureDuration = 0;
    } else {
      if (!this.poorPostureStart) this.poorPostureStart = now;
      this.poorPostureDuration = Math.floor((now - this.poorPostureStart) / 1000);
    }
    
    // Update display zone
    this.displayZone = smoothedZone;
    
    // Update PSI (simpler version for ML mode)
    const badnessScore = smoothedZone === 'GREEN' ? 0 : (smoothedZone === 'RED' ? 0.9 : 0.4);
    this._updatePSI(badnessScore);
    
    // Take temporal snapshot every second
    if (now - this.lastSnapshotTime >= 1000) {
      this._takeSnapshot(badnessScore, now);
      this.lastSnapshotTime = now;
    }
    
    return POSTURE_LABEL[smoothedZone];
  }

  // ─── PSI calculation 
  _updatePSI(badnessScore) {
    // badnessScore: 0 = good, 1 = very bad
    const scorePenalty = badnessScore * 60;
    
    // Streak penalty
    const streakPenalty = Math.min(this.poorPostureDuration / 120, 1) * 15;
    
    this.psi = Math.max(0, Math.round(100 - scorePenalty - streakPenalty));
  }

  // ─── Snapshot for trend analysis 
  _takeSnapshot(score, ts) {
    this.history.push({ score, zone: this.displayZone, ts });
    if (this.history.length > 30) this.history.shift();
    
    // Calculate trend
    if (this.history.length >= 10) {
      const mid = Math.floor(this.history.length / 2);
      const first = this.history.slice(0, mid);
      const last = this.history.slice(mid);
      
      const avgFirst = first.reduce((s, h) => s + h.score, 0) / first.length;
      const avgLast = last.reduce((s, h) => s + h.score, 0) / last.length;
      const delta = avgLast - avgFirst;
      
      if (delta > 0.25) this.trend = "DEGRADING";
      else if (delta < -0.20) this.trend = "IMPROVING";
      else this.trend = "STABLE";
    }
  }

  // ─── Public getters 
  getSessionStats() {
    if (this.sessionFrames === 0) return { goodPercent: 0, poorDuration: 0 };
    return {
      goodPercent: Math.round((this.goodFrames / this.sessionFrames) * 100),
      poorDuration: this.poorPostureDuration,
    };
  }

  getAnalysis() {
    return {
      psi: this.psi,
      trend: this.trend,
      driftAxes: [],
      historyWindow: this.history.length,
      usingML: this.lastMLPrediction !== null,
    };
  }
}