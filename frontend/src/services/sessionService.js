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