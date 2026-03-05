import React, { createContext, useContext, useEffect, useState } from "react";
import { logger } from "../utils/logger";
const log = logger.scoped('AudioContext');

interface AudioContextType {
  audioInputs: MediaDeviceInfo[];
}

const AudioDevicesContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);

  const updateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(
        (device) => device.kind === "audioinput" && device.deviceId !== "default" && device.deviceId !== "communications"
      );
      setAudioInputs(Array.from(new Map(mics.map((d) => [d.deviceId, d])).values()));
    } catch (_e) {
      setAudioInputs([]);
    }
  };

  useEffect(() => {
    if (!navigator.mediaDevices) {
      log.warn("navigator.mediaDevices not available — audio input detection disabled");
      return;
    }
    updateDevices();
    navigator.mediaDevices.addEventListener("devicechange", updateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", updateDevices);
    };
  }, []);

  return (
    <AudioDevicesContext.Provider value={{ audioInputs }}>
      {children}
    </AudioDevicesContext.Provider>
  );
};

export const useAudioContext = () => {
  const ctx = useContext(AudioDevicesContext);
  if (!ctx) throw new Error("AudioContext not found");
  return ctx;
};
