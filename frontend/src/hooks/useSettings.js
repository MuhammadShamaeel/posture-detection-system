import { useState, useEffect } from "react";

export const useSettings = () => {
  const [voiceAlert, setVoiceAlert] = useState(true);
  const [mirrorCamera, setMirrorCamera] = useState(false);

  
  useEffect(() => {
    const v = localStorage.getItem("voice_alert");
    const m = localStorage.getItem("mirror_camera");

    if (v !== null) setVoiceAlert(v === "true");
    if (m !== null) setMirrorCamera(m === "true");
  }, []);

  
  useEffect(() => {
    localStorage.setItem("voice_alert", voiceAlert);
  }, [voiceAlert]);

  useEffect(() => {
    localStorage.setItem("mirror_camera", mirrorCamera);
  }, [mirrorCamera]);

  return {
    voiceAlert,
    setVoiceAlert,
    mirrorCamera,
    setMirrorCamera,
  };
};