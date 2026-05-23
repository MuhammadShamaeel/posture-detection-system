import React, { useState, useCallback } from "react";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "../utils/userSettings";

// ─── Toggle switch component ──────────────────────────────────────────────────
const Toggle = ({ id, checked, onChange, disabled = false }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2
      border-transparent transition-colors duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2
      focus:ring-offset-zinc-900
      ${checked ? "bg-emerald-500" : "bg-zinc-700"}
      ${disabled ? "opacity-40 cursor-not-allowed" : ""}
    `}
  >
    <span
      className={`
        inline-block h-5 w-5 rounded-full bg-white shadow-sm
        ring-0 transition-transform duration-200 ease-in-out
        ${checked ? "translate-x-5" : "translate-x-0"}
      `}
    />
  </button>
);

// ─── Setting row ──────────────────────────────────────────────────────────────
const SettingRow = ({ label, description, id, checked, onChange, tag }) => (
  <div className="flex items-start justify-between gap-6 py-4
    border-b border-zinc-800 last:border-none">
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium text-zinc-200 cursor-pointer">
          {label}
        </label>
        {tag && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border
            border-emerald-400/30 bg-emerald-400/10 text-emerald-400 uppercase tracking-widest">
            {tag}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
    <div className="shrink-0 pt-0.5">
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  </div>
);

// ─── Save indicator ───────────────────────────────────────────────────────────
const SaveIndicator = ({ state }) => {
  if (state === "idle") return null;
  return (
    <span className={`text-xs transition-all duration-300
      ${state === "saved" ? "text-emerald-400" : "text-zinc-500"}`}>
      {state === "saving" ? "Saving..." : "✓ Saved"}
    </span>
  );
};

// ─── Settings page ────────────────────────────────────────────────────────────
export default function Settings() {
  const [settings,   setSettings]   = useState(() => loadSettings());
  const [saveState,  setSaveState]  = useState("idle"); // idle | saving | saved
  const [resetConf,  setResetConf]  = useState(false);

  // Auto-save whenever settings change, with a brief "Saved" flash
  const persist = useCallback((updated) => {
    setSaveState("saving");
    saveSettings(updated);
    // Brief delay so the user sees the indicator
    setTimeout(() => setSaveState("saved"), 150);
    setTimeout(() => setSaveState("idle"),  1800);
  }, []);

  const update = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  }, [persist]);

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
    setResetConf(false);
  };

  // ── What each setting actually does ───────────────────────────────────────
  const CAMERA_SETTINGS = [
    {
      key  : "mirrorCamera",
      label: "Mirror Camera",
      tag  : "Display",
      desc : "Flips the camera view horizontally — like looking in a mirror. " +
             "Useful if you find the un-mirrored view disorienting. " +
             "The posture detection engine automatically adjusts landmark " +
             "positions so accuracy is unaffected.",
    },
  ];

  const ALERT_SETTINGS = [
    {
      key  : "voiceAlert",
      label: "Voice Alerts",
      tag  : "Audio",
      desc : "Speaks a short message when poor or adjusted posture is detected " +
             "and persists for more than 20 seconds. The alert repeats every " +
             "30 seconds while poor posture continues. Turn this off in shared " +
             "or quiet environments.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">

      {/* ── Header ── */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-wide">Settings</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Preferences are saved to this device per account
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* ── Camera section ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Camera</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5">
            {CAMERA_SETTINGS.map(({ key, label, tag, desc }) => (
              <SettingRow
                key={key}
                id={key}
                label={label}
                tag={tag}
                description={desc}
                checked={settings[key]}
                onChange={(val) => update(key, val)}
              />
            ))}
          </div>

          {/* Mirror preview */}
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/50
            px-4 py-3 flex items-center gap-4">
            <div className="w-16 h-12 rounded-lg border border-zinc-700 bg-zinc-800
              flex items-center justify-center overflow-hidden shrink-0 relative">
              {/* Simplified face silhouette — normal */}
              <svg viewBox="0 0 40 30" className={`w-10 h-8 text-zinc-500
                transition-transform duration-300 ${settings.mirrorCamera ? "scale-x-[-1]" : ""}`}>
                <ellipse cx="20" cy="12" rx="8" ry="9" fill="currentColor" opacity="0.4"/>
                <rect x="13" y="21" width="14" height="6" rx="3" fill="currentColor" opacity="0.25"/>
                <circle cx="17" cy="11" r="1.5" fill="currentColor" opacity="0.7"/>
                <circle cx="23" cy="11" r="1.5" fill="currentColor" opacity="0.7"/>
                <path d="M17 15 Q20 17 23 15" stroke="currentColor" strokeWidth="1.2"
                  fill="none" opacity="0.6"/>
              </svg>
              {settings.mirrorCamera && (
                <span className="absolute bottom-0.5 right-0.5 text-[7px]
                  text-emerald-400 bg-emerald-400/10 px-1 rounded">↔</span>
              )}
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">
                Preview: {settings.mirrorCamera ? "Mirrored" : "Normal"}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {settings.mirrorCamera
                  ? "Camera view is horizontally flipped"
                  : "Camera view is shown as captured"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Alerts section ── */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Alerts</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5">
            {ALERT_SETTINGS.map(({ key, label, tag, desc }) => (
              <SettingRow
                key={key}
                id={key}
                label={label}
                tag={tag}
                description={desc}
                checked={settings[key]}
                onChange={(val) => update(key, val)}
              />
            ))}
          </div>

          {/* Voice alert info box */}
          <div className={`mt-3 rounded-xl border px-4 py-3 text-xs transition-all duration-300
            ${settings.voiceAlert
              ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-600"}`}>
            <div className="flex items-center gap-2">
              <span>{settings.voiceAlert ? "🔊" : "🔇"}</span>
              <span>
                {settings.voiceAlert
                  ? "Voice alerts are active. You'll hear a spoken warning after 20s of poor posture."
                  : "Voice alerts are muted. Only visual feedback will be shown."}
              </span>
            </div>
          </div>
        </div>

        {/* ── Persistence note ── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
            About your settings
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Settings are saved to this browser on a per-account basis. They persist across
            sessions — logging out and back in on this device will restore your preferences.
            Settings do not sync across different devices or browsers.
          </p>
        </div>

        {/* ── Reset ── */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-400 font-medium">Reset to defaults</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Restore all settings to their original values
            </p>
          </div>
          {!resetConf ? (
            <button
              onClick={() => setResetConf(true)}
              className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-1.5
                border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
            >
              Reset
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Sure?</span>
              <button
                onClick={handleReset}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5
                  border border-red-400/20 hover:border-red-400/40 rounded-lg
                  bg-red-400/5 transition-colors"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setResetConf(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}