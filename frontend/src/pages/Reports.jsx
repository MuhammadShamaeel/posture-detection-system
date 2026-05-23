import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSessionStore } from "../hooks/useSessionStore";


// ─── Helpers 

const fmt = {
  // "15 Jan 2024"
  date: (iso) => new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  }),
  // "09:32 AM"
  time: (iso) => new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  }),
  // 3661 → "1h 01m 01s"
  duration: (sec) => {
    if (sec < 60)  return `${sec}s`;
    if (sec < 3600) {
      const m = Math.floor(sec / 60), s = sec % 60;
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    }
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  },
};

const PSI_BAND = (psi) => {
  if (psi >= 80) return { label: "Excellent", color: "text-emerald-400", bar: "bg-emerald-400" };
  if (psi >= 60) return { label: "Good",      color: "text-teal-400",    bar: "bg-teal-400"    };
  if (psi >= 40) return { label: "Fair",       color: "text-amber-400",   bar: "bg-amber-400"   };
  if (psi >= 20) return { label: "Poor",       color: "text-orange-400",  bar: "bg-orange-400"  };
  return               { label: "Critical",    color: "text-red-400",     bar: "bg-red-400"     };
};

const TREND_CFG = {
  STABLE    : { icon: "→", color: "text-zinc-400",    bg: "bg-zinc-800"       },
  DEGRADING : { icon: "↘", color: "text-red-400",     bg: "bg-red-400/10"     },
  IMPROVING : { icon: "↗", color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

const DRIFT_LABEL = {
  forwardLean: "Forward Lean", headDrop: "Head Drop", neckTilt: "Neck Tilt",
  lateralTilt: "Lateral Tilt", shoulderImbalance: "Shoulder",
};

// ─── Stat pill used in summary row ───────────────────────────────────────────
const StatPill = ({ label, value, sub, color = "text-zinc-100" }) => (
  <div className="flex flex-col gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 min-w-0">
    <p className="text-[10px] text-zinc-500 uppercase tracking-widest whitespace-nowrap">{label}</p>
    <p className={`text-xl font-bold font-mono tabular-nums ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-zinc-600 leading-tight">{sub}</p>}
  </div>
);

// ─── Posture breakdown bar ────────────────────────────────────────────────────
const PostureBar = ({ good, adjust, poor }) => (
  <div className="flex h-2 w-full rounded-full overflow-hidden gap-px">
    <div className="bg-emerald-400 rounded-l-full" style={{ width: `${good}%` }} />
    <div className="bg-amber-400"                   style={{ width: `${adjust}%` }} />
    <div className="bg-red-400 rounded-r-full"      style={{ width: `${poor}%` }} />
  </div>
);

// ─── Session card ─────────────────────────────────────────────────────────────
const SessionCard = ({ session, onDelete, expanded, onToggle }) => {
  const psi    = PSI_BAND(session.psi);
  const trend  = TREND_CFG[session.trend] ?? TREND_CFG.STABLE;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden
      hover:border-zinc-700 transition-colors">

      {/* ── Card header — always visible ── */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        {/* PSI circle */}
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
          shrink-0 font-bold text-sm font-mono tabular-nums
          ${psi.color} border-current/30`}>
          {session.psi}
        </div>

        {/* Date + time */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-zinc-100 leading-tight">
            {fmt.date(session.date)}
          </span>
          <span className="text-xs text-zinc-500">{fmt.time(session.date)}</span>
        </div>

        {/* Duration */}
        <div className="flex flex-col items-center ml-2 shrink-0">
          <span className="text-xs text-zinc-400 font-mono">{fmt.duration(session.durationSec)}</span>
          <span className="text-[9px] text-zinc-600">duration</span>
        </div>

        {/* Posture bar preview */}
        <div className="flex-1 min-w-0 hidden sm:block">
          <PostureBar
            good={session.goodPercent}
            adjust={session.adjustPercent}
            poor={session.poorPercent}
          />
          <div className="flex gap-3 mt-1 text-[9px] text-zinc-600">
            <span className="text-emerald-500">{session.goodPercent}% good</span>
            <span className="text-amber-500">{session.adjustPercent}% adjust</span>
            <span className="text-red-500">{session.poorPercent}% poor</span>
          </div>
        </div>

        {/* Trend badge */}
        <span className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full
          text-xs font-medium shrink-0 ${trend.bg} ${trend.color}`}>
          {trend.icon} {session.trend}
        </span>

        {/* Alerts badge */}
        {session.alertCount > 0 && (
          <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full
            text-[10px] bg-red-400/10 text-red-400 border border-red-400/20 shrink-0">
            ⚠ {session.alertCount} alert{session.alertCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Chevron */}
        <span className={`text-zinc-600 text-xs shrink-0 transition-transform duration-200
          ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="border-t border-zinc-800 px-5 py-4 flex flex-col gap-4">

          {/* Posture bar (mobile — also shown expanded) */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
              Posture Breakdown
            </p>
            <PostureBar
              good={session.goodPercent}
              adjust={session.adjustPercent}
              poor={session.poorPercent}
            />
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="text-zinc-300">Good <strong>{session.goodPercent}%</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="text-zinc-300">Adjust <strong>{session.adjustPercent}%</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span className="text-zinc-300">Poor <strong>{session.poorPercent}%</strong></span>
              </span>
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">PSI Score</p>
              <p className={`text-lg font-bold font-mono ${psi.color}`}>{session.psi}</p>
              <p className="text-[10px] text-zinc-500">{psi.label}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Trend</p>
              <p className={`text-sm font-medium ${trend.color}`}>
                {trend.icon} {session.trend}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Alerts Fired</p>
              <p className="text-lg font-bold font-mono text-zinc-100">{session.alertCount}</p>
              <p className="text-[10px] text-zinc-500">beep alerts</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Worst Streak</p>
              <p className="text-lg font-bold font-mono text-zinc-100">
                {fmt.duration(session.poorStreakMax)}
              </p>
              <p className="text-[10px] text-zinc-500">continuous poor</p>
            </div>
          </div>

          {/* Drift axes */}
          {session.driftAxes?.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                Drift Detected
              </p>
              <div className="flex flex-wrap gap-2">
                {session.driftAxes.map((ax) => (
                  <span key={ax}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium
                      bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    ↑ {DRIFT_LABEL[ax] ?? ax}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => onDelete(session.id)}
              className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
            >
              Delete session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Reports page ─────────────────────────────────────────────────────────────
const Reports = () => {
  const { sessions, deleteSession, clearAll, loading } = useSessionStore();
  const location = useLocation();
  const [expandedId, setExpandedId]           = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Auto-expand session from navigation state
  useEffect(() => {
    if (location.state?.expandSessionId) {
      setExpandedId(location.state.expandSessionId);
    }
  }, [location.state]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        Loading sessions...
      </div>
    );
  }

  // ── Aggregate stats across all sessions ───────────────────────────────────
  const total = sessions.length;
  const totalTimeSec  = sessions.reduce((s, r) => s + r.durationSec, 0);
  const totalAlerts   = sessions.reduce((s, r) => s + r.alertCount,  0);
  const avgPSI        = total
    ? Math.round(sessions.reduce((s, r) => s + r.psi, 0) / total)
    : 0;
  const avgGood       = total
    ? Math.round(sessions.reduce((s, r) => s + r.goodPercent, 0) / total)
    : 0;

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">

      {/* ── Header ── */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-wide">
            Session Reports
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Posture monitoring history · {total} session{total !== 1 ? "s" : ""}
          </p>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2">
            {showClearConfirm ? (
              <>
                <span className="text-xs text-zinc-500">Clear all?</span>
                <button
                  onClick={() => { clearAll(); setShowClearConfirm(false); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400
                    border border-red-400/20 hover:bg-red-500/25 transition-colors"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400
                    hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Summary stats row ── */}
        {total > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatPill
                label="Total Sessions"
                value={total}
                sub="all time"
              />
              <StatPill
                label="Total Time"
                value={fmt.duration(totalTimeSec)}
                sub="monitored"
              />
              <StatPill
                label="Avg Good Posture"
                value={`${avgGood}%`}
                sub="across sessions"
                color={avgGood >= 70 ? "text-emerald-400" : avgGood >= 40 ? "text-amber-400" : "text-red-400"}
              />
              <StatPill
                label="Avg PSI"
                value={avgPSI}
                sub={PSI_BAND(avgPSI).label}
                color={PSI_BAND(avgPSI).color}
              />
              <StatPill
                label="Total Alerts"
                value={totalAlerts}
                sub="beep alerts fired"
                color={totalAlerts > 0 ? "text-red-400" : "text-zinc-100"}
              />
            </div>

            {/* ── Session list ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Sessions — newest first
                </p>
                <div className="flex items-center gap-3 text-[9px] text-zinc-700">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Good
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Adjust
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Poor
                  </span>
                </div>
              </div>

              {sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onDelete={deleteSession}
                  expanded={expandedId === s.id}
                  onToggle={() => toggleExpand(s.id)}
                />
              ))}
            </div>
          </>
        ) : (

          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800
              flex items-center justify-center text-2xl text-zinc-700">
              ◎
            </div>
            <div className="text-center">
              <p className="text-zinc-400 text-sm font-medium">No sessions yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Start a monitoring session and click Stop — your report will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;