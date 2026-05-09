// Pure math helpers — no state, no side effects.
// Used by postureCalibration.js and postureDetection.js

/**
 * Calculate the angle at vertex point `b` formed by points a → b → c.
 * Returns angle in degrees (0–180).
 */
export function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Extract the 5 normalized posture features from MediaPipe landmarks.
 *
 * All spatial features are normalized by shoulder width so the values
 * are scale-invariant (works for people sitting close or far from camera).
 *
 * @param {Array} lm - MediaPipe poseLandmarks array (33 points)
 * @returns {{ neckAngle, shoulderTilt, headOffsetX, forwardHeadZ, forwardHeadY }}
 */
export function extractFeatures(lm) {
  const nose          = lm[0];
  const leftShoulder  = lm[11];
  const rightShoulder = lm[12];

  // Mid-point between the two shoulders
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  };

  // A point directly above the shoulder center (virtual vertical reference)
  const verticalPoint = {
    x: shoulderCenter.x,
    y: shoulderCenter.y - 0.2,
    z: shoulderCenter.z,
  };

  // Angle of the neck relative to vertical — larger = more forward tilt
  const neckAngle = calculateAngle(nose, shoulderCenter, verticalPoint);

  // Shoulder width used as the normalization denominator
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) || 0.001;

  // How much one shoulder is higher than the other (normalized)
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y) / shoulderWidth;

  // How far the nose is laterally offset from the shoulder center (normalized)
  const headOffsetX = Math.abs(nose.x - shoulderCenter.x) / shoulderWidth;

  // How far the head has moved forward in depth — z decreases as you lean forward
  const forwardHeadZ = (shoulderCenter.z - nose.z) / shoulderWidth;

  // How far the nose has dropped vertically relative to shoulders (normalized)
  // Positive = nose below shoulder center = forward head slump
  const forwardHeadY = (nose.y - shoulderCenter.y) / shoulderWidth;

  return {
    neckAngle,
    shoulderTilt,
    headOffsetX,
    forwardHeadZ,
    forwardHeadY,
  };
}