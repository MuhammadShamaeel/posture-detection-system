import React from "react";
import { getZoneConfig } from "../constants";

const StatusCard = ({ phase, posture, isRunning, calibProgress }) => {  // Add calibProgress prop
  const displayPosture = phase === "done" ? posture : "—";
  const zoneConfig = getZoneConfig(phase === "done" ? posture : null);
  const isCalibrated = phase === "done";
  
  return (
    <div className={`rounded-xl border p-4 ${isCalibrated ? zoneConfig.bg + " " + zoneConfig.border : "bg-zinc-900 border-zinc-800"}`}>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Status</p>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${isCalibrated ? zoneConfig.dot : "bg-zinc-600"} ${isCalibrated && posture !== "Good Posture" ? "animate-pulse" : ""}`} />
        <span className={`text-xl font-semibold ${isCalibrated ? zoneConfig.color : "text-zinc-500"}`}>
          {displayPosture}
        </span>
      </div>
      {!isRunning && (
        <p className="text-zinc-600 text-xs mt-2">Start monitor to begin</p>
      )}
      {isRunning && phase === "idle" && (
        <p className="text-zinc-600 text-xs mt-2">Click Calibrate when ready</p>
      )}
      {phase === "calibrating" && (
        <p className="text-blue-400 text-xs mt-2">Recording baseline... {calibProgress}%</p>
      )}
    </div>
  );
};

export default StatusCard;