// ─────────────────────────────────────────────────────────────────────────────
// postureBeep.js
// Web Audio API double-beep — no libraries, no audio files needed.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Play a double-beep alert using the Web Audio API.
 * Creates and discards its own AudioContext — no memory leaks.
 *
 * @param {object} options
 * @param {number} options.frequency  Hz of the tone        (default 880 = A5)
 * @param {number} options.volume     gain 0–1              (default 0.4)
 * @param {number} options.duration   ms per beep           (default 180)
 * @param {number} options.gap        ms silence between    (default 120)
 */
export function playPostureBeep({
  frequency = 880,
  volume    = 0.4,
  duration  = 180,
  gap       = 120,
} = {}) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const beep = (startTime, freq) => {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  const dur = duration / 1000;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.linearRampToValueAtTime(0, startTime + dur);

  osc.start(startTime);
  osc.stop(startTime + dur);
};

const t0 = ctx.currentTime;

beep(t0, 1000);
beep(t0 + 0.2, 1400);  // higher pitch

    
    // Free the AudioContext after both beeps finish
    setTimeout(() => ctx.close(), (duration * 2 + gap) + 200);
  } catch (err) {
    // Silently fail if browser blocks AudioContext before user interaction
    console.warn("Posture beep failed:", err.message);
  }
}