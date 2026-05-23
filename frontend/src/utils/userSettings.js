//
// Settings are stored in localStorage keyed by user ID.
// This means:
//   ✓ Settings survive logout/login on the same device
//   ✓ User A's settings never affect User B on shared devices
//   ✓ Easy to swap to a backend API later — just replace load/save below
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "posture_settings_";

// ─── Default settings shape ───────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  mirrorCamera : false, // flip canvas horizontally (feels natural for some users)
  voiceAlert   : true,  // speak posture warnings aloud
};

// ─── Get current user ID from localStorage (set by AuthForm on login) ─────────
function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    // Use email as a stable key; fall back to "guest" for guest sessions
    return user?.email ?? user?.id ?? "guest";
  } catch {
    return "guest";
  }
}

function storageKey() {
  return `${STORAGE_PREFIX}${getUserId()}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Load settings for the current user. Always returns a complete object. */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...DEFAULT_SETTINGS };
    // Merge with defaults so new settings added in future releases aren't missing
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Save a partial or full settings object for the current user. */
export function saveSettings(partial) {
  try {
    const current = loadSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(storageKey(), JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed to save settings:", err);
    return loadSettings();
  }
}