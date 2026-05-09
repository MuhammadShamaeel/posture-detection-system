import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PostureEngine } from "../utils/PostureEngine/postureEngine";
import { loadSettings, saveSettings } from "../utils/userSettings";

import TopBar           from "../components/monitor/components/TopBar";
import AlertBanner      from "../components/monitor/components/AlertBanner";
import VideoCanvas      from "../components/monitor/components/VideoCanvas";
import StatusCard       from "../components/monitor/components/StatusCard";
import CalibrationPanel from "../components/monitor/components/CalibrationPanel";
import SessionStats     from "../components/monitor/components/SessionStats";
import PostureAnalysis  from "../components/monitor/components/PostureAnalysis";

import { useMonitorStats }    from "../components/monitor/hooks/useMonitorStats";
import { usePostureAlert }    from "../components/monitor/hooks/usePostureAlert";
import { usePostureAnalysis } from "../components/monitor/hooks/usePostureAnalysis";
import { useSessionStore }    from "../hooks/useSessionStore";

const Monitor = () => {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const engineRef   = useRef(null);
  const pipVideoRef = useRef(null);

  // Session tracking refs
  const sessionStartRef  = useRef(null);
  const alertCountRef    = useRef(0);
  const pausedAtRef      = useRef(null);
  const totalPausedMsRef = useRef(0);

  const { addSession } = useSessionStore();
  const navigate = useNavigate();

  const { alertShownRef, checkAndShowAlert, dismissAlert: dismissAlertFromHook } =
    usePostureAlert();

  // ── Settings — loaded once on mount, keyed by user ID ────────────────────
  // Stored in state so the UI reflects the current value.
  // Also kept in a ref so the engine can read the latest value synchronously.
  const [settings] = useState(() => loadSettings());
  const settingsRef = useRef(settings);

  // Whenever settings state changes: persist to localStorage AND
  // push to the engine immediately (no restart needed).
  useEffect(() => {
    settingsRef.current = settings;
    saveSettings(settings);
    if (engineRef.current) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings]);

  const [isRunning,     setIsRunning]     = useState(false);
  const [isPaused,      setIsPaused]      = useState(false);
  const [posture,       setPosture]       = useState("Waiting...");
  const [phase,         setPhase]         = useState("idle");
  const [countdown,     setCountdown]     = useState(null);
  const [calibProgress, setCalibProgress] = useState(0);
  const [sessionStats,  setSessionStats]  = useState({ goodPercent: 0, poorDuration: 0 });
  const [alertVisible,  setAlertVisible]  = useState(false);

  const isCalibrated = phase === "done";

  useMonitorStats(isRunning, phase, engineRef, setCalibProgress, setSessionStats);
  const analysis = usePostureAnalysis(isRunning, isCalibrated, engineRef);

  React.useEffect(() => {
    if (isCalibrated && !isPaused) {
      const prevCount = alertCountRef.current;
      checkAndShowAlert(sessionStats.poorDuration, analysis.trend, setAlertVisible);
      if (alertShownRef.current && alertCountRef.current === prevCount) {
        alertCountRef.current += 1;
      }
    }
  }, [sessionStats.poorDuration, analysis.trend, isCalibrated, isPaused,
      checkAndShowAlert, alertShownRef]);

  // ─── Start ────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    sessionStartRef.current  = Date.now();
    alertCountRef.current    = 0;
    totalPausedMsRef.current = 0;
    pausedAtRef.current      = null;

    setIsRunning(true);
    setIsPaused(false);
    setPhase("idle");
    setPosture("Waiting...");
    setCalibProgress(0);
    setSessionStats({ goodPercent: 0, poorDuration: 0 });
    setAlertVisible(false);
    alertShownRef.current = false;

    // Pass current settings into the engine at construction time
    engineRef.current = new PostureEngine(
      videoRef.current,
      canvasRef.current,
      setPosture,
      () => { setPhase("done"); setCalibProgress(100); },
      settingsRef.current    // ← settings passed here
    );

    await engineRef.current.start();
  };

  // ─── Pause ────────────────────────────────────────────────────────────────
  const handlePause = useCallback(() => {
    if (!engineRef.current || isPaused) return;
    engineRef.current.pause();
    pausedAtRef.current = Date.now();
    setIsPaused(true);
    setPosture("Paused");
    setAlertVisible(false);
  }, [isPaused]);

  // ─── Resume ───────────────────────────────────────────────────────────────
  const handleResume = useCallback(async () => {
    if (!engineRef.current || !isPaused) return;
    if (pausedAtRef.current) {
      totalPausedMsRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    await engineRef.current.resume();
    setIsPaused(false);
  }, [isPaused]);

  // ─── Stop ─────────────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (isPaused && pausedAtRef.current) {
      totalPausedMsRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    const totalElapsedMs = sessionStartRef.current
      ? Date.now() - sessionStartRef.current : 0;
    const durationSec = Math.floor(
      (totalElapsedMs - totalPausedMsRef.current) / 1000
    );

    const finalStats    = engineRef.current?.getSessionStats() ?? sessionStats;
    const finalAnalysis = engineRef.current?.getAnalysis()     ?? analysis;

    let expandSessionId = null;

    if (isCalibrated && durationSec > 10) {
      const poorPercent   = Math.max(0, 100 - finalStats.goodPercent);
      const adjustPercent = Math.round(poorPercent * 0.4);
      const newSession = await addSession({
        durationSec,
        goodPercent   : finalStats.goodPercent,
        adjustPercent,
        poorPercent   : poorPercent - adjustPercent,
        psi           : finalAnalysis.psi,
        trend         : finalAnalysis.trend,
        driftAxes     : finalAnalysis.driftAxes ?? [],
        alertCount    : alertCountRef.current,
        poorStreakMax : finalStats.poorDuration,
      });
      expandSessionId = newSession?.id;
    }

    setIsRunning(false);
    setIsPaused(false);
    setPhase("idle");
    setPosture("Stopped");
    setAlertVisible(false);
    alertShownRef.current    = false;
    sessionStartRef.current  = null;
    alertCountRef.current    = 0;
    totalPausedMsRef.current = 0;

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    }

    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }

    if (canvasRef.current) {
      canvasRef.current.getContext("2d")
        .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // Navigate to reports, expanding the new session if created
    navigate('/reports', { state: { expandSessionId } });
  };

  // ─── Calibrate ────────────────────────────────────────────────────────────
  const handleCalibrate = useCallback(() => {
    setPhase("countdown");
    setCalibProgress(0);
    let count = 3;
    setCountdown(count);
    const iv = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(iv);
        setPhase("calibrating");
        setCountdown(null);
        if (engineRef.current) engineRef.current.startCalibration();
      }
    }, 1000);
  }, []);

  const dismissAlert = () => dismissAlertFromHook(setAlertVisible);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <TopBar isRunning={isRunning} />

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        <AlertBanner alertVisible={alertVisible} onDismiss={dismissAlert} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VideoCanvas
              videoRef={videoRef}
              canvasRef={canvasRef}
              pipVideoRef={pipVideoRef}
              isRunning={isRunning}
              phase={phase}
              countdown={countdown}
              calibProgress={calibProgress}
            />
          </div>

          <div className="flex flex-col gap-4">
            <StatusCard
              phase={phase}
              posture={posture}
              isRunning={isRunning}
              calibProgress={calibProgress}
              isPaused={isPaused}
            />
            <CalibrationPanel
              isRunning={isRunning}
              phase={phase}
              countdown={countdown}
              calibProgress={calibProgress}
              onCalibrate={handleCalibrate}
            />
            <SessionStats
              isCalibrated={isCalibrated}
              sessionStats={sessionStats}
            />
          </div>
        </div>

        <PostureAnalysis analysis={analysis} isCalibrated={isCalibrated} />

        {/* ── Controls ── */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400
              disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm
              font-medium transition-colors"
          >
            Start
          </button>

          {isCalibrated && (
            isPaused ? (
              <button
                onClick={handleResume}
                className="px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400
                  text-white text-sm font-medium transition-colors
                  inline-flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 2l7 4-7 4V2z" />
                </svg>
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={!isRunning}
                className="px-5 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600
                  disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200
                  text-sm font-medium transition-colors border border-zinc-600
                  inline-flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="2" width="3" height="8" rx="1" />
                  <rect x="7" y="2" width="3" height="8" rx="1" />
                </svg>
                Pause
              </button>
            )
          )}

          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700
              disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200
              text-sm font-medium transition-colors border border-zinc-700"
          >
            Stop & Save
          </button>

          {isRunning && (
            <span className="text-zinc-600 text-xs ml-1">
              {isPaused                            && "Session paused"}
              {!isPaused && phase === "idle"        && "Waiting to calibrate"}
              {!isPaused && phase === "countdown"   && "Starting calibration..."}
              {!isPaused && phase === "calibrating" && `Calibrating... ${calibProgress}%`}
              {!isPaused && phase === "done"        && "Monitoring active"}
            </span>
          )}
        </div>

        {isPaused && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg
            border border-indigo-400/20 bg-indigo-400/5 text-xs text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            Session paused — paused time won't count toward your session.
            Click <strong className="font-semibold mx-1">Resume</strong> when you're back.
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitor;