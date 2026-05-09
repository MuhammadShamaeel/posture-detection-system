import React, { useEffect, useState, useCallback, useRef } from "react";
import AuthForm from "../components/forms/AuthForm.jsx";
import {
  Shield, Cpu, Database, Target, Activity, TrendingUp,
  Zap, BarChart3, Eye, RotateCcw, Award, CheckCircle2, ChevronRight,
} from "lucide-react";


const Counter = ({ target, suffix = "", duration = 1500 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const isFloat = String(target).includes(".");
        const end = parseFloat(target);
        const steps = 40;
        const step = duration / steps;
        let i = 0;
        const iv = setInterval(() => {
          i++;
          const progress = i / steps;
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = end * eased;
          setVal(isFloat ? current.toFixed(1) : Math.round(current));
          if (i >= steps) clearInterval(iv);
        }, step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
};

// ─── Zone badge (matches monitor HUD pill exactly) 
const ZoneBadge = ({ zone }) => {
  const cfg = {
    GREEN:  { label: "Good Posture",    dot: "bg-emerald-400", text: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/10" },
    YELLOW: { label: "Adjust Posture",  dot: "bg-amber-400",   text: "text-amber-400",   border: "border-amber-400/30",   bg: "bg-amber-400/10"   },
    RED:    { label: "Poor Posture",    dot: "bg-red-400",     text: "text-red-400",     border: "border-red-400/30",     bg: "bg-red-400/10"     },
  }[zone];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
};

// ─── Mini monitor mockup 
const MonitorMockup = () => {
  const zones = ["GREEN", "GREEN", "GREEN", "YELLOW", "GREEN", "RED", "GREEN"];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % zones.length), 2000);
    return () => clearInterval(iv);
  }, [zones.length]);

  const zone = zones[idx];
  const skeletonColor = zone === "GREEN" ? "#22c55e" : zone === "YELLOW" ? "#eab308" : "#ef4444";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Posture Monitor</span>
        </div>
        <span className="text-[10px] text-zinc-700 font-mono">mediapipe / pose</span>
      </div>

      {/* Canvas area */}
      <div className="relative bg-zinc-950 aspect-video flex items-center justify-center overflow-hidden">
        {/* Simulated skeleton SVG */}
        <svg width="200" height="160" viewBox="0 0 200 160" className="opacity-90">
          {/* Bones */}
          {[
            [100,30, 70,65], [100,30, 130,65], [70,65, 130,65],
            [70,65, 55,100], [55,100, 45,130],
            [130,65, 145,100], [145,100, 155,130],
            [70,65, 65,115], [130,65, 135,115], [65,115, 135,115],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={skeletonColor} strokeWidth="2" strokeLinecap="round"
              style={{ transition: "stroke 0.5s" }} />
          ))}
          {/* Joints */}
          {[[100,30],[70,65],[130,65],[55,100],[145,100],[45,130],[155,130],[65,115],[135,115]].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="4" fill={skeletonColor}
              stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"
              style={{ transition: "fill 0.5s" }} />
          ))}
        </svg>

        {/* HUD pill — bottom left, matches engine exactly */}
        <div className="absolute bottom-3 left-3">
          <ZoneBadge zone={zone} />
        </div>

        {/* PSI badge — bottom right */}
        <div className="absolute bottom-3 right-3 font-mono text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800">
          PSI <span className="text-emerald-400 font-bold">87</span>
        </div>
      </div>

      {/* Status row */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Status</span>
        </div>
        <ZoneBadge zone={zone} />
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollToAuth = useCallback(() => {
    document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const privacyFeatures = [
    { icon: Shield,   title: "No Video Stored",  desc: "Webcam feed processed in real time. Never recorded, saved, or sent anywhere." },
    { icon: Cpu,      title: "Runs Locally",      desc: "Posture analysis happens entirely in your browser. No cloud processing, no uploads." },
    { icon: Database, title: "Metrics Only",      desc: "We store posture scores and session stats — never images, never video frames." },
  ];

  const stats = [
    { value: "88",  suffix: "",    label: "Mean PSI in natural session" },
    { value: "16",  suffix: "pt",  label: "Deeper PSI sensitivity" },
    { value: "100", suffix: "%",   label: "Episode-level accuracy" },
    { value: "27",  suffix: "min", label: "Natural session validated" },
  ];

  const steps = [
    { num: "01", icon: Target,    title: "Calibrate Once",
      desc: "Sit upright for 5 seconds. Posture+ captures your neutral baseline — shoulder width, ear position, spine alignment — scaled relative to your body." },
    { num: "02", icon: Activity,  title: "Monitor in Real Time",
      desc: "Your webcam tracks head pitch, lateral tilt, and shoulder imbalance at every frame. The PSI engine processes temporal stability — not just snapshots." },
    { num: "03", icon: TrendingUp, title: "Get Smarter Over Time",
      desc: "Session reports show PSI trends, fatigue patterns, and degradation index. Auto-recalibration prevents chronic slouch from becoming your new normal." },
  ];

  const features = [
    { icon: Award,    title: "Multiplicative PSI",     desc: "Quality × Stability. Chronic degradation can't hide behind short-term steadiness." },
    { icon: Eye,      title: "Webcam Only",            desc: "No wearables. No sensors. Just your laptop camera and 5 seconds to calibrate." },
    { icon: BarChart3, title: "Session Analytics",     desc: "PSI slope, fatigue flags, zone breakdowns — every session saved and analysed." },
    { icon: RotateCcw, title: "Guarded Recalibration", desc: "Baseline only drifts during verified good posture. Slouch never becomes your normal." },
    { icon: Zap,      title: "Real-Time Zones",        desc: "GREEN, YELLOW, RED with temporal hysteresis — no false alarms from a single bad frame." },
    { icon: Activity, title: "Fatigue Detection",      desc: "Detects cumulative fatigue patterns across a session, not just instantaneous deviation." },
  ];

  return (
    <div className="bg-zinc-950 text-zinc-100 font-mono">

      {/* ── Navbar ── */}
      <nav className={`fixed w-full z-50 transition-all duration-300
        ${scrolled ? "bg-zinc-950/95 backdrop-blur border-b border-zinc-800" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            
            
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered
            </span>
            <button
              onClick={scrollToAuth}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full
              border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 text-[10px] uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3" />
              Science-backed posture monitoring
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-zinc-100">
              The first posture monitor that tracks{" "}
              <span className="text-emerald-400">persistence</span>,
              not just position.
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              Most tools alert you once and forget. Posture+ tracks how long instability lasts —
              because that's what actually damages your spine over time.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={scrollToAuth}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400
                  text-white text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                Start Monitoring <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-zinc-600">Free · No hardware · No credit card</span>
            </div>

            {/* Zone legend */}
            <div className="flex flex-wrap gap-2 pt-2">
              <ZoneBadge zone="GREEN" />
              <ZoneBadge zone="YELLOW" />
              <ZoneBadge zone="RED" />
            </div>
          </div>

          {/* Right: live mockup */}
          <div className="lg:pl-8">
            <MonitorMockup />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-1">
              <p className="text-3xl font-bold text-zinc-100 tabular-nums">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Privacy First</p>
            <h2 className="text-2xl font-bold text-zinc-100">
              Your camera never leaves your device.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {privacyFeatures.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3
                  hover:border-zinc-700 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-1">{item.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-2xl font-bold text-zinc-100 mb-10">
            Three steps to better posture.
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6
                  hover:border-zinc-700 transition-colors flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-zinc-800 tabular-nums select-none">
                      {item.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-2">{item.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                  {/* Progress bar accent */}
                  <div className="h-0.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-auto">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${[40, 70, 100][i]}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">

            {/* Sticky left */}
            <div className="md:sticky md:top-24 flex flex-col gap-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Features</p>
              <h2 className="text-2xl font-bold text-zinc-100 leading-tight">
                Built different.<br />
                <span className="text-emerald-400">Designed to last.</span>
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                Every other posture tool fires alerts when you slouch. Posture+ models the
                <em className="text-zinc-300 not-italic"> persistence</em> of your instability —
                because chronic, stable slouch is exactly what hurts your spine over time.
              </p>

              {/* Mini PSI gauge preview */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 mt-2">
                <div className="relative w-14 h-14">
                  <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#27272a" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#22c55e" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22 * 0.87} ${2 * Math.PI * 22}`}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-400">87</span>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Posture Stability Index</p>
                  <p className="text-sm text-zinc-200 font-semibold">Excellent</p>
                </div>
              </div>
            </div>

            {/* Feature grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4
                    flex gap-3 hover:border-zinc-700 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-emerald-500/10
                      flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-200 mb-1">{item.title}</h3>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Auth section ── */}
      <section id="auth" className="py-24 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* Left copy */}
          <div className="flex flex-col gap-5">
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Get Started</p>
            <h2 className="text-3xl font-bold text-zinc-100 leading-tight">
              Be good to your<br />
              <span className="text-emerald-400">neck and spine.</span>
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Free to use. No credit card. No hardware required.
              Your camera stays on your device.
            </p>

            {/* Feature checklist */}
            <div className="flex flex-col gap-2 mt-2">
              {["Personalised baseline calibration", "Real-time zone detection", "Session history & reports", "Smart beep alerts"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-400/30
                    flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Auth form — dark-themed wrapper */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <AuthForm />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            
          </div>
          <div className="flex gap-5 text-xs text-zinc-600">
            {["Privacy", "Terms", "Contact"].map(l => (
              <button key={l} className="hover:text-zinc-400 transition-colors">{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;