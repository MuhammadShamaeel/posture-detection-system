// import { useRef } from "react";
// import { POOR_POSTURE_ALERT_SECONDS } from "../constants";

// export const usePostureAlert = () => {
//   const alertShownRef = useRef(false);
  
//   const checkAndShowAlert = (poorDuration, setAlertVisible) => {
//     if (
//       poorDuration >= POOR_POSTURE_ALERT_SECONDS &&
//       !alertShownRef.current
//     ) {
//       alertShownRef.current = true;
//       setAlertVisible(true);
//     }
    
//     // Reset alert if posture improves
//     if (poorDuration < 5) {
//       alertShownRef.current = false;
//       setAlertVisible(false);
//     }
//   };
  
//   const dismissAlert = (setAlertVisible) => {
//     setAlertVisible(false);
//     alertShownRef.current = true;
//   };
  
//   return { alertShownRef, checkAndShowAlert, dismissAlert };
// }; 

import { useRef } from "react";
import { POOR_POSTURE_ALERT_SECONDS } from "../constants";
import { playPostureBeep } from "../utils/postureBeep";

/**
 * usePostureAlert — Smart alert hook with beep.
 *
 * Alert fires when BOTH are true:
 *   1. poorDuration >= POOR_POSTURE_ALERT_SECONDS (20s)
 *   2. trend === "DEGRADING"  (eliminates false positives from brief slumps)
 *
 * Beep repeat behaviour:
 *   - Beeps at 20s, then again every 20s while posture stays poor + degrading.
 *   - Dismissing the banner does NOT suppress the next beep interval.
 *   - Everything resets automatically when poorDuration drops below 5s.
 */
export const usePostureAlert = () => {
  const alertShownRef = useRef(false);
  // Which 20s-multiple we last beeped at — prevents double-firing
  const lastBeepAtRef = useRef(0);

  /**
   * @param {number}   poorDuration   continuous seconds of poor posture
   * @param {string}   trend          "STABLE" | "DEGRADING" | "IMPROVING"
   * @param {Function} setAlertVisible React state setter
   */
  const checkAndShowAlert = (poorDuration, trend, setAlertVisible) => {
    const beepInterval = POOR_POSTURE_ALERT_SECONDS;
    const beepCount    = Math.floor(poorDuration / beepInterval);

    // Fire when a new 20s threshold is crossed AND trend is degrading
    if (beepCount > 0 && beepCount > lastBeepAtRef.current && trend === "DEGRADING") {
      lastBeepAtRef.current = beepCount;
      alertShownRef.current = true;
      setAlertVisible(true);
      playPostureBeep();
    }

    // Posture corrected — reset everything for the next bout
    if (poorDuration < 5) {
      lastBeepAtRef.current = 0;
      alertShownRef.current = false;
      setAlertVisible(false);
    }
  };

  const dismissAlert = (setAlertVisible) => {
    setAlertVisible(false);
    // lastBeepAtRef intentionally NOT reset — beep fires again at next interval
  };

  return { alertShownRef, checkAndShowAlert, dismissAlert };
};