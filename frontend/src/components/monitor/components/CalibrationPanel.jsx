import React from "react";

const CalibrationPanel = ({ isRunning, phase, countdown, calibProgress, onCalibrate }) => {
  if (!isRunning) return null;
  
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Calibration</p>

      {phase === "idle" && (
        <div className="flex flex-col gap-2">
          <p className="text-zinc-400 text-xs leading-relaxed">
            Sit in your natural comfortable position, then calibrate so the system learns your baseline posture.
          </p>
          <button
            onClick={onCalibrate}
            className="mt-2 w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
          >
            Calibrate
          </button>
        </div>
      )}

      {phase === "countdown" && (
        <div className="text-center py-2">
          <p className="text-amber-400 text-xs mb-1">Prepare to hold still</p>
          <p className="text-3xl font-bold text-amber-400 tabular-nums">{countdown}</p>
        </div>
      )}

      {phase === "calibrating" && (
        <div className="flex flex-col gap-2">
          <p className="text-blue-400 text-xs">Hold your posture still...</p>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${calibProgress}%` }}
            />
          </div>
          <p className="text-zinc-500 text-xs text-right">{calibProgress}%</p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <span>✓</span>
            <span>Baseline learned</span>
          </div>
          <p className="text-zinc-500 text-xs">Detection is now personalized to your posture.</p>
          <button
            onClick={onCalibrate}
            className="mt-1 w-full py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            Recalibrate
          </button>
        </div>
      )}
    </div>
  );
};

export default CalibrationPanel;