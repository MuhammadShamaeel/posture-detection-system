// // ─── Constants ───────────────────────────────────────────────────────────────
// export const POOR_POSTURE_ALERT_SECONDS = 60; // alert after 60s continuous poor posture

// // ─── Helper: posture zone config ─────────────────────────────────────────────
// export const ZONE_CONFIG = {
//   "Good Posture":    { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", dot: "bg-emerald-400" },
//   "Adjust Posture":  { color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/30",   dot: "bg-amber-400"   },
//   "Poor Posture":    { color: "text-red-400",      bg: "bg-red-400/10",     border: "border-red-400/30",     dot: "bg-red-400"     },
//   "Calibrating...":  { color: "text-blue-400",     bg: "bg-blue-400/10",    border: "border-blue-400/30",    dot: "bg-blue-400"    },
//   default:           { color: "text-zinc-400",     bg: "bg-zinc-800",       border: "border-zinc-700",       dot: "bg-zinc-500"    },
// };

// export const getZoneConfig = (posture) => ZONE_CONFIG[posture] || ZONE_CONFIG.default; 

// ─── Alert threshold ──────────────────────────────────────────────────────────
// ─── Alert threshold ──────────────────────────────────────────────────────────
// Beep + banner fires after this many continuous seconds of poor posture
// (and only when trend is DEGRADING — see usePostureAlert)
export const POOR_POSTURE_ALERT_SECONDS = 20;

// ─── Zone display config ──────────────────────────────────────────────────────
export const ZONE_CONFIG = {
  "Good Posture"   : { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", dot: "bg-emerald-400" },
  "Adjust Posture" : { color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/30",   dot: "bg-amber-400"   },
  "Poor Posture"   : { color: "text-red-400",      bg: "bg-red-400/10",     border: "border-red-400/30",     dot: "bg-red-400"     },
  "Calibrating..."  : { color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/30",    dot: "bg-blue-400"    },
  default           : { color: "text-zinc-400",    bg: "bg-zinc-800",       border: "border-zinc-700",       dot: "bg-zinc-500"    },
};

export const getZoneConfig = (posture) => ZONE_CONFIG[posture] || ZONE_CONFIG.default;

// ─── PSI display bands ────────────────────────────────────────────────────────
export const PSI_BANDS = [
  { min: 80, label: "Excellent", color: "text-emerald-400", bar: "bg-emerald-400", ring: "border-emerald-400/40" },
  { min: 60, label: "Good",      color: "text-teal-400",    bar: "bg-teal-400",    ring: "border-teal-400/40"    },
  { min: 40, label: "Fair",      color: "text-amber-400",   bar: "bg-amber-400",   ring: "border-amber-400/40"   },
  { min: 20, label: "Poor",      color: "text-orange-400",  bar: "bg-orange-400",  ring: "border-orange-400/40"  },
  { min:  0, label: "Critical",  color: "text-red-400",     bar: "bg-red-400",     ring: "border-red-400/40"     },
];

export const getPSIBand = (psi) =>
  PSI_BANDS.find((b) => psi >= b.min) ?? PSI_BANDS[PSI_BANDS.length - 1];

// ─── Trend display config ─────────────────────────────────────────────────────
export const TREND_CONFIG = {
  STABLE    : { label: "Stable",    color: "text-zinc-400",    icon: "→", bg: "bg-zinc-800"       },
  DEGRADING : { label: "Degrading", color: "text-red-400",     icon: "↘", bg: "bg-red-400/10"     },
  IMPROVING : { label: "Improving", color: "text-emerald-400", icon: "↗", bg: "bg-emerald-400/10" },
};

// ─── Drift axis human-readable labels ────────────────────────────────────────
export const DRIFT_AXIS_LABEL = {
  forwardLean       : "Forward Lean",
  headDrop          : "Head Drop",
  neckTilt          : "Neck Tilt",
  lateralTilt       : "Lateral Tilt",
  shoulderImbalance : "Shoulder Imbalance",
};