import React, { useMemo } from "react";
import { useSessionStore } from "../hooks/useSessionStore";


const fmt = {
  duration: (sec) => {
    if (!sec || sec < 1) return "0s";
    if (sec < 60)   return `${sec}s`;
    if (sec < 3600) { const m = Math.floor(sec/60), s = sec%60; return `${m}m ${s>0?` ${s}s`:""}`; }
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60);
    return `${h}h ${m>0?`${m}m`:""}`;
  },
  date: (iso) => new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short" }),
};

const PSI_BAND = (psi) => {
  if (psi >= 80) return { label:"Excellent", color:"text-emerald-400", bar:"bg-emerald-400", ring:"border-emerald-400/30" };
  if (psi >= 60) return { label:"Good",      color:"text-teal-400",    bar:"bg-teal-400",    ring:"border-teal-400/30"    };
  if (psi >= 40) return { label:"Fair",      color:"text-amber-400",   bar:"bg-amber-400",   ring:"border-amber-400/30"   };
  if (psi >= 20) return { label:"Poor",      color:"text-orange-400",  bar:"bg-orange-400",  ring:"border-orange-400/30"  };
  return               { label:"Critical",   color:"text-red-400",     bar:"bg-red-400",     ring:"border-red-400/30"     };
};

const DRIFT_LABEL = {
  forwardLean:"Forward Lean", headDrop:"Head Drop", neckTilt:"Neck Tilt",
  lateralTilt:"Lateral Tilt", shoulderImbalance:"Shoulder Imbalance",
};



const SectionLabel = ({ children }) => (
  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">{children}</p>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${className}`}>
    {children}
  </div>
);

const BigStat = ({ label, value, sub, color = "text-zinc-100" }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{label}</p>
    <p className={`text-2xl font-bold font-mono tabular-nums ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-zinc-600">{sub}</p>}
  </div>
);

// ─── PSI Sparkline 
const PSISparkline = ({ values }) => {
  if (values.length < 2) return null;
  const W = 100, H = 36, pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const last = values[values.length - 1];
  const band = PSI_BAND(last);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={band.color}
      />
      {/* Last point dot */}
      {values.length > 0 && (() => {
        const [lx, ly] = pts.split(" ").pop().split(",").map(Number);
        return <circle cx={lx} cy={ly} r="2.5" className={band.bar} fill="currentColor" />;
      })()}
    </svg>
  );
};

// ─── Horizontal stacked posture bar ──────────────────────────────────────────
const PostureStackBar = ({ good, adjust, poor }) => (
  <div className="flex h-2.5 w-full rounded-full overflow-hidden gap-px">
    <div className="bg-emerald-400" style={{ width: `${good}%`   }} />
    <div className="bg-amber-400"  style={{ width: `${adjust}%` }} />
    <div className="bg-red-400"    style={{ width: `${poor}%`   }} />
  </div>
);

// ─── Insight tag ──────────────────────────────────────────────────────────────
const InsightTag = ({ icon, text, color }) => (
  <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs ${color}`}>
    <span className="mt-px shrink-0">{icon}</span>
    <span>{text}</span>
  </div>
);

// ─── Main computations ────────────────────────────────────────────────────────
function computeInsights(sessions) {
  if (!sessions.length) return null;

  const n = sessions.length;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalTimeSec   = sessions.reduce((s, r) => s + r.durationSec, 0);
  const totalAlerts    = sessions.reduce((s, r) => s + r.alertCount,  0);
  const avgPSI         = Math.round(sessions.reduce((s, r) => s + r.psi, 0) / n);
  const avgGood        = Math.round(sessions.reduce((s, r) => s + r.goodPercent, 0) / n);
  const avgDuration    = Math.round(totalTimeSec / n);

  // ── Best / worst ──────────────────────────────────────────────────────────
  const bestSession  = sessions.reduce((a, b) => a.psi >= b.psi ? a : b);
  const worstSession = sessions.reduce((a, b) => a.psi <= b.psi ? a : b);

  // ── PSI trend (last 5 sessions, oldest→newest) ────────────────────────────
  // sessions are newest-first from the store
  const recent5  = [...sessions].slice(0, 5).reverse();
  const psiValues = recent5.map(s => s.psi);

  let psiSlope = 0;
  if (psiValues.length >= 2) {
    const first = psiValues.slice(0, Math.ceil(psiValues.length / 2));
    const last  = psiValues.slice(Math.ceil(psiValues.length / 2));
    const avgFirst = first.reduce((a,b) => a+b, 0) / first.length;
    const avgLast  = last.reduce((a,b) => a+b, 0)  / last.length;
    psiSlope = avgLast - avgFirst;
  }

  const psiTrend =
    psiSlope > 4  ? "IMPROVING" :
    psiSlope < -4 ? "DEGRADING" :
    "STABLE";

  // ── Alert rate (alerts per hour of monitoring) ────────────────────────────
  const alertsPerHour = totalTimeSec > 0
    ? Math.round((totalAlerts / totalTimeSec) * 3600 * 10) / 10
    : 0;

  // ── Time-of-day split ─────────────────────────────────────────────────────
  const timeOfDay = { morning: 0, afternoon: 0, evening: 0 };
  sessions.forEach(s => {
    const h = new Date(s.date).getHours();
    if (h < 12)       timeOfDay.morning++;
    else if (h < 17)  timeOfDay.afternoon++;
    else              timeOfDay.evening++;
  });
  const peakSlot = Object.entries(timeOfDay).sort((a,b) => b[1]-a[1])[0][0];

  // ── Most common drift axes ─────────────────────────────────────────────────
  const axisCounts = {};
  sessions.forEach(s => (s.driftAxes ?? []).forEach(ax => {
    axisCounts[ax] = (axisCounts[ax] ?? 0) + 1;
  }));
  const topAxes = Object.entries(axisCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 3);

  // ── Consistency: sessions in last 7 days ──────────────────────────────────
  const now = Date.now();
  const sessionsThisWeek = sessions.filter(
    s => (now - new Date(s.date).getTime()) < 7 * 24 * 60 * 60 * 1000
  ).length;

  // ── Degrading sessions ratio ──────────────────────────────────────────────
  const degradingCount = sessions.filter(s => s.trend === "DEGRADING").length;
  const degradingRatio = Math.round((degradingCount / n) * 100);

  // ── PSI over all sessions (oldest→newest for chart) ───────────────────────
  const allPSI = [...sessions].reverse().map(s => s.psi);

  // ── Narrative insights ────────────────────────────────────────────────────
  const narratives = [];

  if (psiTrend === "IMPROVING")
    narratives.push({ icon: "↗", text: "Your PSI has been improving across recent sessions — keep it up.", color: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300" });
  else if (psiTrend === "DEGRADING")
    narratives.push({ icon: "↘", text: "PSI has been declining. Try shorter, more frequent sessions and focus on calibrating carefully.", color: "border-red-400/20 bg-red-400/5 text-red-300" });

  if (avgGood >= 75)
    narratives.push({ icon: "✓", text: `You're in good posture ${avgGood}% of monitored time — well above average.`, color: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300" });
  else if (avgGood < 50)
    narratives.push({ icon: "⚠", text: `Only ${avgGood}% good posture on average. Consider raising your monitor or adjusting your chair height.`, color: "border-amber-400/20 bg-amber-400/5 text-amber-300" });

  if (topAxes.length > 0) {
    const topAxis = DRIFT_LABEL[topAxes[0][0]] ?? topAxes[0][0];
    narratives.push({ icon: "◎", text: `Your most common drift axis is ${topAxis}. Pay attention to this during your next session.`, color: "border-amber-400/20 bg-amber-400/5 text-amber-300" });
  }

  if (alertsPerHour > 3)
    narratives.push({ icon: "🔔", text: `${alertsPerHour} alerts/hour is high. Try setting a posture reminder every 20 minutes.`, color: "border-red-400/20 bg-red-400/5 text-red-300" });
  else if (alertsPerHour === 0 && n >= 3)
    narratives.push({ icon: "✓", text: "Zero alerts fired across your sessions — excellent sustained posture.", color: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300" });

  if (sessionsThisWeek === 0)
    narratives.push({ icon: "◷", text: "No sessions this week. Regular monitoring helps prevent posture fatigue.", color: "border-zinc-600/30 bg-zinc-800/50 text-zinc-400" });
  else if (sessionsThisWeek >= 4)
    narratives.push({ icon: "◷", text: `${sessionsThisWeek} sessions this week — great consistency.`, color: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300" });

  if (degradingRatio > 50)
    narratives.push({ icon: "⚠", text: `${degradingRatio}% of sessions end with a degrading trend. Try taking breaks every 30–40 minutes.`, color: "border-amber-400/20 bg-amber-400/5 text-amber-300" });

  return {
    n, totalTimeSec, totalAlerts, avgPSI, avgGood, avgDuration,
    bestSession, worstSession,
    psiValues, allPSI, psiTrend, psiSlope,
    alertsPerHour, timeOfDay, peakSlot,
    topAxes, axisCounts, sessionsThisWeek, degradingRatio,
    narratives,
  };
}

// ─── Insights page ────────────────────────────────────────────────────────────
export default function Insights() {
  const { sessions, loading } = useSessionStore();
  const ins = useMemo(() => computeInsights(sessions), [sessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm font-mono">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">

      {/* ── Header ── */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-base font-semibold tracking-wide">Session Insights</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          {ins ? `Computed from ${ins.n} session${ins.n !== 1 ? "s" : ""}` : "No data yet"}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Empty state ── */}
        {!ins && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800
              flex items-center justify-center text-3xl text-zinc-700">◎</div>
            <div className="text-center">
              <p className="text-zinc-400 text-sm font-medium">No sessions yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Complete at least one monitoring session to see your insights.
              </p>
            </div>
          </div>
        )}

        {ins && (
          <>
            {/* ── Row 1: Overview stats ── */}
            <div>
              <SectionLabel>Overview</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <BigStat
                    label="Avg PSI"
                    value={ins.avgPSI}
                    sub={PSI_BAND(ins.avgPSI).label}
                    color={PSI_BAND(ins.avgPSI).color}
                  />
                </Card>
                <Card>
                  <BigStat
                    label="Avg Good Posture"
                    value={`${ins.avgGood}%`}
                    sub="of monitored time"
                    color={ins.avgGood >= 70 ? "text-emerald-400" : ins.avgGood >= 40 ? "text-amber-400" : "text-red-400"}
                  />
                </Card>
                <Card>
                  <BigStat
                    label="Avg Session"
                    value={fmt.duration(ins.avgDuration)}
                    sub="per session"
                  />
                </Card>
                <Card>
                  <BigStat
                    label="Alert Rate"
                    value={ins.alertsPerHour}
                    sub="alerts per hour"
                    color={ins.alertsPerHour > 3 ? "text-red-400" : ins.alertsPerHour > 1 ? "text-amber-400" : "text-emerald-400"}
                  />
                </Card>
              </div>
            </div>

            {/* ── Row 2: PSI over time sparkline + trend ── */}
            <div>
              <SectionLabel>PSI Trend</SectionLabel>
              <Card>
                <div className="flex items-start justify-between gap-6">

                  {/* Left: trend label */}
                  <div className="flex flex-col gap-3 shrink-0">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                        Across sessions
                      </p>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${ins.psiTrend === "IMPROVING" ? "bg-emerald-400/10 text-emerald-400" :
                          ins.psiTrend === "DEGRADING" ? "bg-red-400/10 text-red-400" :
                          "bg-zinc-800 text-zinc-400"}`}>
                        {ins.psiTrend === "IMPROVING" ? "↗" : ins.psiTrend === "DEGRADING" ? "↘" : "→"}
                        {ins.psiTrend}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Best session</p>
                        <p className={`text-sm font-bold font-mono ${PSI_BAND(ins.bestSession.psi).color}`}>
                          PSI {ins.bestSession.psi}
                        </p>
                        <p className="text-[10px] text-zinc-600">{fmt.date(ins.bestSession.date)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Worst session</p>
                        <p className={`text-sm font-bold font-mono ${PSI_BAND(ins.worstSession.psi).color}`}>
                          PSI {ins.worstSession.psi}
                        </p>
                        <p className="text-[10px] text-zinc-600">{fmt.date(ins.worstSession.date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: sparkline */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[9px] text-zinc-700 mb-1">
                      <span>Oldest</span>
                      <span>Latest</span>
                    </div>
                    <PSISparkline values={ins.allPSI} />
                    {/* Y axis labels */}
                    <div className="flex justify-between text-[9px] text-zinc-700 mt-1">
                      <span>{Math.min(...ins.allPSI)}</span>
                      <span className="text-zinc-600">PSI</span>
                      <span>{Math.max(...ins.allPSI)}</span>
                    </div>

                    {/* Session dots below sparkline */}
                    {ins.allPSI.length > 1 && (
                      <div className="flex justify-between mt-3 gap-1">
                        {ins.allPSI.map((v, i) => {
                          const band = PSI_BAND(v);
                          return (
                            <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full ${band.bar}`} />
                              <span className={`text-[8px] tabular-nums ${band.color}`}>{v}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Row 3: Posture quality + drift ── */}
            <div className="grid sm:grid-cols-2 gap-4">

              {/* Average posture breakdown */}
              <Card>
                <SectionLabel>Avg Posture Quality</SectionLabel>
                <PostureStackBar
                  good={ins.avgGood}
                  adjust={Math.round((100 - ins.avgGood) * 0.4)}
                  poor={Math.round((100 - ins.avgGood) * 0.6)}
                />
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-zinc-300">Good <strong>{ins.avgGood}%</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span className="text-zinc-300">Adjust <strong>{Math.round((100-ins.avgGood)*0.4)}%</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    <span className="text-zinc-300">Poor <strong>{Math.round((100-ins.avgGood)*0.6)}%</strong></span>
                  </span>
                </div>

                {/* Degrading session ratio */}
                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Sessions ending degraded</span>
                  <span className={`text-xs font-mono font-bold
                    ${ins.degradingRatio > 50 ? "text-red-400" : ins.degradingRatio > 25 ? "text-amber-400" : "text-emerald-400"}`}>
                    {ins.degradingRatio}%
                  </span>
                </div>
              </Card>

              {/* Top drift axes */}
              <Card>
                <SectionLabel>Common Drift Axes</SectionLabel>
                {ins.topAxes.length === 0 ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs mt-2">
                    <span>✓</span>
                    <span>No drift detected across sessions</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {Object.entries(ins.axisCounts)
                      .sort((a,b) => b[1]-a[1])
                      .map(([ax, count]) => {
                        const pct = Math.round((count / ins.n) * 100);
                        return (
                          <div key={ax}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-zinc-300">{DRIFT_LABEL[ax] ?? ax}</span>
                              <span className="text-[10px] text-zinc-500 tabular-nums font-mono">
                                {count}/{ins.n} sessions ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct > 60 ? "bg-red-400" : pct > 30 ? "bg-amber-400" : "bg-zinc-600"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>
            </div>

            {/* ── Row 4: Time-of-day + consistency ── */}
            <div className="grid sm:grid-cols-2 gap-4">

              {/* Time of day */}
              <Card>
                <SectionLabel>Sessions by Time of Day</SectionLabel>
                <div className="flex flex-col gap-3">
                  {[
                    { slot: "morning",   label: "Morning",   range: "Before 12pm", emoji: "🌅" },
                    { slot: "afternoon", label: "Afternoon", range: "12pm – 5pm",  emoji: "☀" },
                    { slot: "evening",   label: "Evening",   range: "After 5pm",   emoji: "🌙" },
                  ].map(({ slot, label, range, emoji }) => {
                    const count = ins.timeOfDay[slot];
                    const pct   = ins.n > 0 ? Math.round((count / ins.n) * 100) : 0;
                    const isPeak = slot === ins.peakSlot;
                    return (
                      <div key={slot}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{emoji}</span>
                            <div>
                              <span className="text-xs text-zinc-300">{label}</span>
                              {isPeak && (
                                <span className="ml-2 text-[9px] text-emerald-400 bg-emerald-400/10
                                  px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                                  most active
                                </span>
                              )}
                              <p className="text-[9px] text-zinc-600">{range}</p>
                            </div>
                          </div>
                          <span className="text-xs text-zinc-400 font-mono tabular-nums">
                            {count} session{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPeak ? "bg-emerald-400" : "bg-zinc-600"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Consistency + this week */}
              <Card>
                <SectionLabel>Monitoring Consistency</SectionLabel>
                <div className="flex flex-col gap-4">

                  {/* This week */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-300 font-medium">This week</p>
                      <p className="text-[10px] text-zinc-600">Last 7 days</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold font-mono tabular-nums
                        ${ins.sessionsThisWeek >= 4 ? "text-emerald-400" :
                          ins.sessionsThisWeek >= 2 ? "text-amber-400" :
                          "text-zinc-400"}`}>
                        {ins.sessionsThisWeek}
                      </p>
                      <p className="text-[10px] text-zinc-600">session{ins.sessionsThisWeek !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  {/* Consistency bar */}
                  <div>
                    <div className="flex justify-between text-[9px] text-zinc-600 mb-1">
                      <span>0</span>
                      <span>7 sessions / week (target)</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700
                          ${ins.sessionsThisWeek >= 5 ? "bg-emerald-400" :
                            ins.sessionsThisWeek >= 3 ? "bg-amber-400" : "bg-zinc-600"}`}
                        style={{ width: `${Math.min(100, (ins.sessionsThisWeek / 7) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Total sessions</span>
                    <span className="text-sm font-bold font-mono text-zinc-200">{ins.n}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Total monitored</span>
                    <span className="text-sm font-bold font-mono text-zinc-200">
                      {fmt.duration(ins.totalTimeSec)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Row 5: Narrative insights ── */}
            {ins.narratives.length > 0 && (
              <div>
                <SectionLabel>Smart Insights</SectionLabel>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ins.narratives.map((n, i) => (
                    <InsightTag key={i} icon={n.icon} text={n.text} color={n.color} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}