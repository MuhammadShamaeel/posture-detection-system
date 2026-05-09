import { Pose }   from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

import { extractFeatures }    from "./postureUtils";
import { PostureCalibration } from "./postureCalibration";
import { PostureDetector }    from "./postureDetection";
import { speakPosture }       from "./postureVoice";
import { DEFAULT_SETTINGS }   from "../userSettings";

const UPPER_BODY_POINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24];

const SKELETON_CONNECTIONS = [
  [0,  11], [0,  12],
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 23], [12, 24],
  [23, 24],
];

const ZONE_COLOR = {
  GREEN  : "#22c55e",
  YELLOW : "#eab308",
  RED    : "#ef4444",
};

const HUD = {
  PILL_X      : 16,
  PILL_Y      : 16,
  PILL_H      : 32,
  PILL_RADIUS : 8,
  FONT_SIZE   : 13,
  DOT_R       : 5,
  LABEL : {
    GREEN  : "Good Posture",
    YELLOW : "Adjust Posture",
    RED    : "Poor Posture",
  },
  BG : {
    GREEN  : "rgba(34,  197, 94,  0.18)",
    YELLOW : "rgba(234, 179,  8,  0.18)",
    RED    : "rgba(239,  68, 68,  0.18)",
    PAUSED : "rgba(99,  102, 241, 0.18)",
  },
  BORDER : {
    GREEN  : "rgba(34,  197, 94,  0.55)",
    YELLOW : "rgba(234, 179,  8,  0.55)",
    RED    : "rgba(239,  68, 68,  0.55)",
    PAUSED : "rgba(99,  102, 241, 0.55)",
  },
};

const VOICE = {
  SAME_ZONE_COOLDOWN_MS : 30_000,
  SPEAK_ZONES           : ["YELLOW", "RED"],
  MESSAGE : {
    YELLOW : "Please adjust your posture.",
    RED    : "Poor posture detected. Sit up straight.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────

export class PostureEngine {
  /**
   * @param {HTMLVideoElement}  videoElement
   * @param {HTMLCanvasElement} canvasElement
   * @param {Function}          setPosture
   * @param {Function}          onCalibrated
   * @param {object}            settings     - from loadSettings(), live-updatable
   */
  constructor(videoElement, canvasElement, setPosture, onCalibrated = null, settings = {}) {
    this.video      = videoElement;
    this.canvas     = canvasElement;
    this.setPosture = setPosture;

    this.camera    = null;
    this.pose      = null;
    this.isStopped = false;
    this.isPaused  = false;

    // ── Settings — merged with defaults so missing keys are always safe ──────
    this.settings = { ...DEFAULT_SETTINGS, ...settings };

    this.calibration = new PostureCalibration();
    this.detector    = new PostureDetector();

    this.calibration.onCalibrated(() => {
      if (onCalibrated) onCalibrated();
    });

    this._lastSpokenZone = null;
    this._lastSpokenAt   = 0;
  }

  // ─── Live settings update ────────────────────────────────────────────────
  // Called by Monitor.jsx whenever the user changes a setting mid-session.
  // Takes effect on the very next frame — no restart needed.
  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };

    // If voice was just turned off, stop any speech in progress immediately
    if (partial.voiceAlert === false) {
      window.speechSynthesis?.cancel();
      this._lastSpokenZone = null;
      this._lastSpokenAt   = 0;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  startCalibration() {
    this.detector.reset();
    this.calibration.start();
  }

  get calibrationProgress() {
    return this.calibration.progress;
  }

  getSessionStats() {
    return this.detector.getSessionStats();
  }

  getAnalysis() {
    return this.detector.getAnalysis();
  }

  // ─── Pause ────────────────────────────────────────────────────────────────
  pause() {
    if (this.isStopped || this.isPaused) return;
    this.isPaused = true;
    if (this.camera) this.camera.stop();
    window.speechSynthesis?.cancel();
    this._drawPauseOverlay();
  }

  // ─── Resume ───────────────────────────────────────────────────────────────
  async resume() {
    if (this.isStopped || !this.isPaused) return;
    this.isPaused = false;

    this.camera = new Camera(this.video, {
      onFrame: async () => {
        if (this.isStopped || this.isPaused || !this.pose) return;
        await this.pose.send({ image: this.video });
      },
      width  : 640,
      height : 480,
    });

    await this.camera.start();
  }

  // ─── Pause overlay ────────────────────────────────────────────────────────
  _drawPauseOverlay() {
    if (!this.canvas) return;
    const ctx    = this.canvas.getContext("2d");
    const width  = this.canvas.width;
    const height = this.canvas.height;

    ctx.fillStyle = "rgba(9, 9, 11, 0.60)";
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    const cx = width / 2;
    const cy = height / 2 - 18;

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.roundRect(cx - 20, cy - 20, 14, 40, 4);
    ctx.roundRect(cx + 6,  cy - 20, 14, 40, 4);
    ctx.fill();

    ctx.font      = "600 14px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Paused", cx, cy + 36);

    ctx.font      = "11px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText("Click Resume when ready", cx, cy + 56);

    ctx.textAlign    = "left";
    ctx.textBaseline = "alphabetic";
  }

  // ─── Voice alert ──────────────────────────────────────────────────────────
  _handleVoiceAlert(zone) {
    // ── Respect voiceAlert setting ─────────────────────────────────────────
    if (!this.settings.voiceAlert) return;

    if (!VOICE.SPEAK_ZONES.includes(zone)) {
      this._lastSpokenZone = null;
      this._lastSpokenAt   = 0;
      return;
    }

    const now         = Date.now();
    const elapsed     = now - this._lastSpokenAt;
    const zoneChanged = zone !== this._lastSpokenZone;
    const cooledDown  = elapsed >= VOICE.SAME_ZONE_COOLDOWN_MS;

    if (zoneChanged || cooledDown) {
      this._lastSpokenZone = zone;
      this._lastSpokenAt   = now;
      speakPosture(VOICE.MESSAGE[zone]);
    }
  }

  // ─── Skeleton drawing ─────────────────────────────────────────────────────
  // When mirrored, landmark x-coords are flipped: mirroredX = (1 - lm.x) * width
  _drawSkeleton(ctx, lm, width, height, zone) {
    const color    = ZONE_COLOR[zone] ?? ZONE_COLOR.GREEN;
    const mirrored = this.settings.mirrorCamera;

    const px = (lm) => mirrored ? (1 - lm.x) * width  : lm.x * width;
    const py = (lm) =>            lm.y * height;

    ctx.lineCap     = "round";
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = color;

    for (const [a, b] of SKELETON_CONNECTIONS) {
      if (!lm[a] || !lm[b]) continue;
      ctx.beginPath();
      ctx.moveTo(px(lm[a]), py(lm[a]));
      ctx.lineTo(px(lm[b]), py(lm[b]));
      ctx.stroke();
    }

    for (const i of UPPER_BODY_POINTS) {
      if (!lm[i]) continue;
      ctx.beginPath();
      ctx.arc(px(lm[i]), py(lm[i]), 5, 0, 2 * Math.PI);
      ctx.fillStyle   = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }

  // ─── HUD overlay ──────────────────────────────────────────────────────────
  _drawHUD(ctx, width, height, zone, label) {
    const color  = zone === "PAUSED" ? "#818cf8" : (ZONE_COLOR[zone] ?? ZONE_COLOR.GREEN);
    const bg     = HUD.BG[zone]     ?? HUD.BG.GREEN;
    const border = HUD.BORDER[zone] ?? HUD.BORDER.GREEN;

    ctx.font = `600 ${HUD.FONT_SIZE}px ui-monospace, monospace`;
    const textW    = ctx.measureText(label).width;
    const dotDiam  = HUD.DOT_R * 2;
    const padX     = 10;
    const gapInner = 7;
    const pillW    = padX + dotDiam + gapInner + textW + padX;
    const pillH    = HUD.PILL_H;
    const pillX    = HUD.PILL_X;
    const pillY    = height - pillH - HUD.PILL_Y;

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, HUD.PILL_RADIUS);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth   = 1;
    ctx.stroke();

    const dotCX = pillX + padX + HUD.DOT_R;
    const dotCY = pillY + pillH / 2;
    ctx.beginPath();
    ctx.arc(dotCX, dotCY, HUD.DOT_R, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle    = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, dotCX + HUD.DOT_R + gapInner, dotCY);
  }

  // ─── MediaPipe results ────────────────────────────────────────────────────
  _onResults(results) {
    if (this.isStopped || this.isPaused) return;

    const ctx    = this.canvas.getContext("2d");
    const width  = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // ── Mirror: flip canvas horizontally before drawing the video frame ────
    if (this.settings.mirrorCamera) {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(results.image, 0, 0, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(results.image, 0, 0, width, height);
    }

    if (!results.poseLandmarks) return;

    const lm       = results.poseLandmarks;
    const features = extractFeatures(lm);
    const cal      = this.calibration;
    const det      = this.detector;

    let hudLabel = null;
    let hudZone  = det.displayZone;

    if (cal.isCalibrating) {
      cal.collect(features);
      this.setPosture("Calibrating...");
      hudLabel = "Calibrating...";
      hudZone  = "GREEN";
    } else if (cal.isCalibrated) {
      const label = det.detect(cal.baseline, features);
      this.setPosture(label);
      hudLabel = label;
      hudZone  = det.displayZone;
      this._handleVoiceAlert(det.displayZone);
    } else {
      this.setPosture("Waiting for calibration...");
      hudLabel = "Waiting...";
      hudZone  = "GREEN";
    }

    // Skeleton landmarks are x-flipped inside _drawSkeleton when mirrored
    this._drawSkeleton(ctx, lm, width, height, det.displayZone);
    if (hudLabel) this._drawHUD(ctx, width, height, hudZone, hudLabel);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  async start() {
    this.isStopped       = false;
    this.isPaused        = false;
    this._lastSpokenZone = null;
    this._lastSpokenAt   = 0;

    this.pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    this.pose.setOptions({
      modelComplexity        : 1,
      smoothLandmarks        : true,
      minDetectionConfidence : 0.6,
      minTrackingConfidence  : 0.6,
    });

    this.pose.onResults((results) => this._onResults(results));

    this.camera = new Camera(this.video, {
      onFrame: async () => {
        if (this.isStopped || this.isPaused || !this.pose) return;
        await this.pose.send({ image: this.video });
      },
      width  : 640,
      height : 480,
    });

    await this.camera.start();
  }

  stop() {
    this.isStopped = true;
    this.isPaused  = false;
    window.speechSynthesis?.cancel();
    if (this.camera) this.camera.stop();
    this.calibration.reset();
    this.detector.reset();
    this.camera = null;
    this.pose   = null;
  }
}