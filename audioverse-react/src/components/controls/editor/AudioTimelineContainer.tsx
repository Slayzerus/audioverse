import React from "react";
import AudioTimeline from "./AudioTimeline";

interface AudioTimelineContainerProps {
  zoom: number;
  duration: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  bpm: number;
  snapEnabled: boolean;
  snapMode: 'beat' | 'bar' | 'second' | 'sub-beat';
  waveform: number[];
  waveformColor: string;
  onCurrentTimeChange: (value: number) => void;
  onZoomChange: (value: number) => void;
}

const AudioTimelineContainer: React.FC<AudioTimelineContainerProps> = (props) => {
  return <AudioTimeline {...props} />;
};

export default AudioTimelineContainer;
