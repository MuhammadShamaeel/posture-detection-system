import React, { useEffect, useRef, useState, useCallback } from "react";

const VideoCanvas = ({
  videoRef,
  canvasRef,
  pipVideoRef,
  isRunning,
  phase,
  countdown,
  calibProgress,
}) => {
  const [isPiP,        setIsPiP]        = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const streamRef      = useRef(null);
  // Track whether PiP was triggered automatically (vs manually by user)
  // so we only auto-exit when we auto-entered — not when user manually opened it
  const autoEnteredRef = useRef(false);

  // ── Browser PiP support check ────────────────────────────────────────────
  useEffect(() => {
    setPipSupported(
      "pictureInPictureEnabled" in document && document.pictureInPictureEnabled
    );
  }, []);

  // ── Canvas → stream → pipVideo pipeline ─────────────────────────────────
  useEffect(() => {
    if (!isRunning || !canvasRef.current || !pipVideoRef?.current) return;

    const stream   = canvasRef.current.captureStream(30);
    streamRef.current = stream;

    const pipVideo    = pipVideoRef.current;
    pipVideo.srcObject = stream;
    pipVideo.muted     = true;
    pipVideo.play().catch(() => {});

    return () => {
      stream.getTracks().forEach((t) => t.stop());
      pipVideo.srcObject = null;
      streamRef.current  = null;
    };
  }, [isRunning, canvasRef, pipVideoRef]);

  // ── Core PiP enter/exit helpers ──────────────────────────────────────────
  const enterPiP = useCallback(async () => {
    if (!pipVideoRef?.current || document.pictureInPictureElement) return;
    try {
      await pipVideoRef.current.requestPictureInPicture();
      setIsPiP(true);
    } catch (err) {
      console.warn("PiP enter failed:", err.message);
    }
  }, [pipVideoRef]);

  const exitPiP = useCallback(async () => {
    if (!document.pictureInPictureElement) return;
    try {
      await document.exitPictureInPicture();
      setIsPiP(false);
    } catch (err) {
      console.warn("PiP exit failed:", err.message);
    }
  }, []);

  // ── Auto PiP on tab switch / window minimize ─────────────────────────────
  // visibilitychange fires for both tab switching AND window minimize
  // on Chrome/Edge/Safari. We only auto-enter when monitoring is active.
  useEffect(() => {
    if (!pipSupported) return;

    const handleVisibilityChange = async () => {
      if (!isRunning) return;

      if (document.hidden) {
        // User switched tab or minimized — auto-enter PiP
        autoEnteredRef.current = true;
        await enterPiP();
      } else {
        // User came back — only auto-exit if WE triggered PiP automatically
        if (autoEnteredRef.current) {
          autoEnteredRef.current = false;
          await exitPiP();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pipSupported, isRunning, enterPiP, exitPiP]);

  // ── Sync isPiP state when browser closes PiP window directly ────────────
  useEffect(() => {
    const handleLeave = () => {
      setIsPiP(false);
      autoEnteredRef.current = false;
    };
    document.addEventListener("leavepictureinpicture", handleLeave);
    return () => document.removeEventListener("leavepictureinpicture", handleLeave);
  }, []);

  // ── Manual toggle button handler ─────────────────────────────────────────
  const handleTogglePiP = async () => {
    if (document.pictureInPictureElement) {
      autoEnteredRef.current = false; // manual exit — clear auto flag
      await exitPiP();
    } else {
      autoEnteredRef.current = false; // manual enter — not auto
      await enterPiP();
    }
  };

  const canUsePiP = pipSupported && isRunning;

  return (
    <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">

      {/* Hidden input video — MediaPipe source */}
      <video ref={videoRef} className="hidden" />

      {/* Hidden output video — PiP source, fed from canvas captureStream */}
      <video ref={pipVideoRef} className="hidden" muted playsInline />

      {/* Main visible canvas */}
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        className="w-full block"
      />

      {/* ── PiP toggle button — top-right corner ── */}
      {canUsePiP && (
        <button
          onClick={handleTogglePiP}
          title={isPiP ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}
          className={`
            absolute top-3 right-3 z-10
            flex items-center gap-1.5
            px-2.5 py-1.5 rounded-lg
            text-xs font-medium border
            transition-all duration-200
            backdrop-blur-sm
            ${isPiP
              ? "bg-blue-500/20 border-blue-400/40 text-blue-300 hover:bg-blue-500/30"
              : "bg-zinc-900/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
            }
          `}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <rect x="1" y="1" width="12" height="9" rx="1.5"
              stroke="currentColor" strokeWidth="1.2" fill="none" />
            <rect x="7" y="5.5" width="5" height="4" rx="1"
              fill="currentColor" opacity="0.9" />
          </svg>
          <span>{isPiP ? "Exit PiP" : "PiP"}</span>
        </button>
      )}

      {/* ── Auto PiP indicator badge — shows when PiP was triggered automatically ── */}
      {isPiP && autoEnteredRef.current && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5
          px-2 py-1 rounded-md bg-zinc-900/80 border border-zinc-700/60
          text-[10px] text-zinc-500 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
          Auto PiP active
        </div>
      )}

      {/* ── Not running overlay ── */}
      {!isRunning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 gap-3">
          <div className="text-zinc-600 text-5xl">◎</div>
          <p className="text-zinc-500 text-sm tracking-wide">Camera inactive</p>
        </div>
      )}

      {/* ── Countdown overlay ── */}
      {phase === "countdown" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm gap-2">
          <p className="text-zinc-300 text-sm tracking-widest uppercase">Sit up straight</p>
          <div className="text-7xl font-bold text-amber-400 tabular-nums">{countdown}</div>
          <p className="text-zinc-500 text-xs">Starting calibration...</p>
        </div>
      )}

      {/* ── Calibrating overlay ── */}
      {phase === "calibrating" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm gap-4 px-8">
          <p className="text-blue-300 text-sm tracking-widest uppercase">Calibrating</p>
          <p className="text-zinc-400 text-xs text-center">
            Hold still. Learning your natural posture baseline...
          </p>
          <div className="w-full max-w-xs">
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${calibProgress}%` }}
              />
            </div>
            <p className="text-zinc-500 text-xs text-center mt-1">{calibProgress}%</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default VideoCanvas;