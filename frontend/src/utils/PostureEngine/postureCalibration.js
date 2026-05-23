// Handles everything related to baseline calibration.
// Collects ~150 frames of feature data, averages them into a personal baseline,
// then fires an onCalibrated(baseline) callback.
// ─────────────────────────────────────────────────────────────────────────────

export const CALIBRATION_FRAMES_NEEDED = 150; // ~5 seconds at 30fps

export class PostureCalibration {
  constructor() {
    this.isCalibrating = false;
    this.isCalibrated  = false;
    this.frames        = [];
    this.progress      = 0;    // 0–100, read by UI
    this.baseline      = null;
    this._onCalibrated = null; // callback: (baseline) => void
  }

  /**
   * Register a callback that fires when calibration completes.
   * @param {Function} cb - receives the baseline object
   */
  onCalibrated(cb) {
    this._onCalibrated = cb;
  }

  /**
   * Begin a fresh calibration session.
   * Call this when the user clicks "Calibrate".
   */
  start() {
    this.isCalibrating = true;
    this.isCalibrated  = false;
    this.frames        = [];
    this.progress      = 0;
    this.baseline      = null;
    console.log("📏 Calibration started...");
  }

  /**
   * Reset everything back to uncalibrated state.
   * Called when the monitor stops.
   */
  reset() {
    this.isCalibrating = false;
    this.isCalibrated  = false;
    this.frames        = [];
    this.progress      = 0;
    this.baseline      = null;
  }

  /**
   * Feed one frame of features into the calibration collector.
   * Automatically finalizes once enough frames are collected.
   *
   * @param {Object} features - output from extractFeatures()
   */
  collect(features) {
    if (!this.isCalibrating) return;

    this.frames.push(features);
    this.progress = Math.min(
      100,
      Math.round((this.frames.length / CALIBRATION_FRAMES_NEEDED) * 100)
    );

    if (this.frames.length < CALIBRATION_FRAMES_NEEDED) return;

    // ── Finalize: average all collected frames ──────────────────────────────
    const avg = (key) =>
      this.frames.reduce((sum, f) => sum + f[key], 0) / this.frames.length;

    this.baseline = {
      neckAngle    : avg("neckAngle"),
      shoulderTilt : avg("shoulderTilt"),
      headOffsetX  : avg("headOffsetX"),
      forwardHeadZ : avg("forwardHeadZ"),
      forwardHeadY : avg("forwardHeadY"),
    };

    this.progress      = 100;
    this.isCalibrating = false;
    this.isCalibrated  = true;

    console.log("✅ Baseline set:", this.baseline);

    if (this._onCalibrated) this._onCalibrated(this.baseline);
  }
}