import React from "react";

const TopBar = ({ isRunning }) => {
  return (
    <div className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
        <span className="text-sm text-zinc-400 tracking-widest uppercase">
          Posture Monitor
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <span>mediapipe</span>
        <span>/</span>
        <span>pose</span>
      </div>
    </div>
  );
};

export default TopBar;