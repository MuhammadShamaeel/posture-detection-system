import React from "react";
import { POOR_POSTURE_ALERT_SECONDS } from "../constants";

const AlertBanner = ({ alertVisible, onDismiss }) => {
  if (!alertVisible) return null;
  
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-red-400/40 bg-red-400/10 text-red-300 text-sm animate-pulse">
      <div className="flex items-center gap-2">
        <span>⚠</span>
        <span>You've been in poor posture for over {POOR_POSTURE_ALERT_SECONDS}s. Take a break and sit up straight.</span>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-200 transition-colors text-xs shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
};

export default AlertBanner;