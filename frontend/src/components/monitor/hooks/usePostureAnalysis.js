//D:\projects\posture-detection-system\frontend\src\components\monitor\hooks\usePostureAnalysis.js
import { useEffect, useRef, useState } from "react";

const DEFAULT_ANALYSIS = {
  psi           : 100,
  trend         : "STABLE",
  driftAxes     : [],
  historyWindow : 0,
};

/**
 * Polls engineRef.current.getAnalysis() every second.
 * Only active when isCalibrated (phase === "done") and isRunning.
 *
 * Returns analysis object: { psi, trend, driftAxes, historyWindow }
 */
export const usePostureAnalysis = (isRunning, isCalibrated, engineRef) => {
  const [analysis, setAnalysis] = useState(DEFAULT_ANALYSIS);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Reset to defaults when not active
    if (!isRunning || !isCalibrated) {
      setAnalysis(DEFAULT_ANALYSIS);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!engineRef.current) return;
      const data = engineRef.current.getAnalysis();
      if (data) setAnalysis(data);
    }, 1000); // 1s is enough — trend/PSI don't need sub-second updates

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isCalibrated, engineRef]);

  return analysis;
};