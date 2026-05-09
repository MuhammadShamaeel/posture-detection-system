export function speakPosture(text) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 1;      // speed (0.5–2)
  utterance.pitch = 1;     // tone
  utterance.volume = 1;    // max volume

  // Optional: better voice (depends on browser)
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v => v.name.includes("Female"));
  if (femaleVoice) utterance.voice = femaleVoice;

  window.speechSynthesis.cancel(); // stop previous speech
  window.speechSynthesis.speak(utterance);
}