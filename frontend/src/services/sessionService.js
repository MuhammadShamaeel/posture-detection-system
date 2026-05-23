import API from "../api/axios";

// GET all sessions
export const fetchSessions = async () => {
  const res = await API.get("/sessions/");
  return res.data;
};

// CREATE session
export const createSession = async (session) => {
  const res = await API.post("/sessions/create/", session);
  return res.data;
};

// DELETE one
export const removeSession = async (id) => {
  await API.delete(`/sessions/${id}/delete/`);
};

// CLEAR all
export const clearSessions = async () => {
  await API.delete("/sessions/clear/");
};

// ─── NEW: ML Posture Prediction ─────────────────────────────────────────────

/**
 * Predict posture using ML model
 * @param {Object} features - Feature values (Age, Knee_Angle, Elbow_Angle, etc.)
 * @returns {Promise} Prediction result
 */
export const predictPostureML = async (features) => {
  const res = await API.post("/sessions/predict/", { features });
  return res.data;
};

/**
 * Batch predict posture for multiple frames
 * @param {Array} frames - Array of frame objects with features
 * @returns {Promise} Batch prediction results
 */
export const batchPredictPostureML = async (frames) => {
  const res = await API.post("/sessions/batch-predict/", { frames });
  return res.data;
};

/**
 * Check if ML model is loaded and ready
 * @returns {Promise} Health status
 */
export const checkModelHealth = async () => {
  const res = await API.get("/sessions/health/");
  return res.data;
};