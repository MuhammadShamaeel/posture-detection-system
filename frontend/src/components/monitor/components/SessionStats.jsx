import React from "react";

const SessionStats = ({ isCalibrated, sessionStats }) => {
  if (!isCalibrated) return null;
  
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Session</p>
      <div className="flex flex-col gap-3">

        {/* Good posture bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400">Good posture</span>
            <span className="text-emerald-400 tabular-nums">{sessionStats.goodPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${sessionStats.goodPercent}%` }}
            />
          </div>
        </div>

        {/* Poor posture duration */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 text-xs">Poor posture streak</span>
          <span className={`text-xs tabular-nums font-medium ${
            sessionStats.poorDuration > 30
              ? "text-red-400"
              : sessionStats.poorDuration > 10
              ? "text-amber-400"
              : "text-zinc-400"
          }`}>
            {sessionStats.poorDuration}s
          </span>
        </div>

      </div>
    </div>
  );
};

export default SessionStats;