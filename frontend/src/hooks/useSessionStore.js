import { useState, useEffect, useCallback } from "react";
import {
  fetchSessions,
  createSession,
  removeSession,
  clearSessions,
} from "../services/sessionService";

// ── Mapper: transform API response to UI shape ───────────────────────────────
const mapSessionFromAPI = (s) => {
  const poorPercent = Math.max(0, 100 - (s.good_percent ?? 0));
  const adjustPercent = Math.round(poorPercent * 0.4);

  return {
    id: s.id,
    date: s.started_at, 
    durationSec: s.duration_sec,
    goodPercent: s.good_percent,
    adjustPercent: adjustPercent,
    poorPercent: poorPercent - adjustPercent,
    psi: s.psi,
    trend: s.trend,
    driftAxes: s.drift_axes ?? [],
    alertCount: s.alert_count,
    poorStreakMax: s.poor_duration,
  };
};

export const useSessionStore = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  //  Load from backend
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSessions();
      setSessions(data.map(mapSessionFromAPI));
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  //  Add session
  const addSession = useCallback(async (data) => {
    try {
      const payload = {
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_sec: data.durationSec,
        calibrated: true,
        good_percent: data.goodPercent,
        poor_duration: data.poorStreakMax,
        psi: data.psi,
        trend: data.trend,
        drift_axes: data.driftAxes,
        alert_count: data.alertCount,
      };

      const newSession = await createSession(payload);

      setSessions((prev) => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      console.error("Failed to save session", err);
    }
  }, []);

  //  Delete
  const deleteSession = useCallback(async (id) => {
    await removeSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  //  Clear all
  const clearAll = useCallback(async () => {
    await clearSessions();
    setSessions([]);
  }, []);

  return {
    sessions,
    loading,
    addSession,
    deleteSession,
    clearAll,
    reload: loadAll,
  };
};