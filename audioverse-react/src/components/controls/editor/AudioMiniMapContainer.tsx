import React from "react";
import AudioMiniMap from "./AudioMiniMap";

interface AudioMiniMapContainerProps {
  duration: number;
  currentTime: number;
  bpm: number;
  waveform: number[];
}

const AudioMiniMapContainer: React.FC<AudioMiniMapContainerProps> = (props) => {
  return <AudioMiniMap {...props} />;
};

export default AudioMiniMapContainer;
