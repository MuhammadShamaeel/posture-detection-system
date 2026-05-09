import React from "react";
import { getPSIBand, TREND_CONFIG, DRIFT_AXIS_LABEL } from "../constants";

// ─── PSI Arc Gauge ────────────────────────────────────────────────────────────
// Draws a semicircular arc gauge using SVG stroke-dasharray.
const PSIGauge = ({ psi, band }) => {
  const R          = 36;              // arc radius
  const CX         = 52;             // centre x
  const CY         = 52;             // centre y
  const CIRCUMF    = 2 * Math.PI * R;
  const ARC_PCT    = 0.75;           // 270° arc (¾ of full circle)
  const arcLen     = CIRCUMF * ARC_PCT;
  const fillLen    = arcLen * (psi / 100);
  const gapLen     = arcLen - fillLen;
  // Rotate so arc starts at ~135° (bottom-left) and sweeps clockwise
  const rotation   = 135;

  return (
    <svg width="104" height="80" viewBox="0 0 104 80" className="overflow-visible">
      {/* Track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#27272a"
        strokeWidth="8"
        strokeDasharray={`${arcLen} ${CIRCUMF - arcLen}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${CX} ${CY})`}
      />
      {/* Fill */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeDasharray={`${fillLen} ${gapLen + CIRCUMF * (1 - ARC_PCT)}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${CX} ${CY})`}
        className={`${band.bar.replace("bg-", "text-")} transition-all duration-700`}
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
      {/* PSI number */}
      <text
        x={CX} y={CY - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`${band.color} font-mono font-bold`}
        style={{ fontSize: "18px", fill: "currentColor" }}
      >
        {psi}
      </text>
      {/* Label below number */}
      <text
        x={CX} y={CY + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: "9px", fill: "#71717a" }}
      >
        {band.label}
      </text>
    </svg>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const PostureAnalysis = ({ analysis, isCalibrated }) => {
  const { psi, trend, driftAxes, historyWindow } = analysis;
  const band        = getPSIBand(psi);
  const trendCfg    = TREND_CONFIG[trend] ?? TREND_CONFIG.STABLE;
  const hasHistory  = historyWindow >= 10; // need ≥10s before showing trend

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">

      {/* Header */}
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
        Intelligence &amp; Analysis
      </p>

      <div className="flex flex-col gap-5">

        {/* ── Row 1: PSI gauge + Trend ── */}
        <div className="flex items-center gap-4">

          {/* PSI gauge */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            {isCalibrated
              ? <PSIGauge psi={psi} band={band} />
              : (
                <div className="w-[104px] h-[80px] flex items-center justify-center">
                  <span className="text-zinc-700 text-xs">—</span>
                </div>
              )
            }
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest -mt-1">
              Stability Index
            </p>
          </div>

          {/* Trend + History */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">

            {/* Trend badge */}
            <div>
              <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Trend</p>
              {isCalibrated && hasHistory ? (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${trendCfg.bg}`}>
                  <span className={`text-sm leading-none ${trendCfg.color}`}>
                    {trendCfg.icon}
                  </span>
                  <span className={trendCfg.color}>{trendCfg.label}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-zinc-800 text-zinc-600">
                  {isCalibrated
                    ? `Collecting… ${historyWindow}s / 10s`
                    : "—"
                  }
                </div>
              )}
            </div>

            {/* History bar */}
            {isCalibrated && (
              <div>
                <div className="flex justify-between text-[9px] text-zinc-600 mb-1">
                  <span>History</span>
                  <span>{historyWindow}s / 30s</span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (historyWindow / 30) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Drift Detection ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Drift Detection</p>
            {isCalibrated && (
              <span className="text-[9px] text-zinc-700 flex items-center gap-1">
                <span className={`w-1 h-1 rounded-full inline-block ${
                  driftAxes.length > 0 ? "bg-amber-400 animate-pulse" : "bg-zinc-600"
                }`} />
                {driftAxes.length > 0 ? `${driftAxes.length} axis drifting` : "No drift"}
              </span>
            )}
          </div>

          {!isCalibrated ? (
            <p className="text-zinc-700 text-xs">Calibrate to enable drift detection.</p>
          ) : driftAxes.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <span>✓</span>
              <span>All axes within baseline range</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {driftAxes.map((axis) => (
                <span
                  key={axis}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium
                    bg-amber-400/10 text-amber-400 border border-amber-400/20"
                >
                  ↑ {DRIFT_AXIS_LABEL[axis] ?? axis}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Row 3: Degradation warning ── */}
        {isCalibrated && trend === "DEGRADING" && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg
            border border-red-400/20 bg-red-400/5 text-xs text-red-300">
            <span className="mt-px shrink-0">⚠</span>
            <span>
              Gradual posture degradation detected over the last {historyWindow}s.
              Take a moment to reset your position.
            </span>
          </div>
        )}

        {isCalibrated && trend === "IMPROVING" && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg
            border border-emerald-400/20 bg-emerald-400/5 text-xs text-emerald-300">
            <span className="mt-px shrink-0">✓</span>
            <span>Posture improving — keep it up.</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default PostureAnalysis;