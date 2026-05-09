//D:\projects\posture-detection-system\frontend\src\components\monitor\hooks\useMonitorStats.js
import { useEffect, useRef } from "react";

export const useMonitorStats = (isRunning, phase, engineRef, setCalibProgress, setSessionStats) => {
  const statsIntervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    statsIntervalRef.current = setInterval(() => {
      if (!engineRef.current) return;

      // Update calibration progress bar
      if (phase === "calibrating" && engineRef.current.calibrationProgress != null) {
        setCalibProgress(engineRef.current.calibrationProgress);
      }

      // Update session stats
      if (phase === "done") {
        const stats = engineRef.current.getSessionStats();
        setSessionStats(stats);
      }
    }, 500);

    return () => clearInterval(statsIntervalRef.current);
  }, [isRunning, phase, engineRef, setCalibProgress, setSessionStats]);
};