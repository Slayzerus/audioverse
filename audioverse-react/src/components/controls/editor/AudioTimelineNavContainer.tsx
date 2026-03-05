import React from "react";
import AudioTimelineNav from "./nav/AudioTimelineNav";

interface AudioTimelineNavContainerProps {
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onRecord: () => void;
  onLoop: () => void;
  onAdjustDuration: (amount: number) => void;
}

const AudioTimelineNavContainer: React.FC<AudioTimelineNavContainerProps> = (props) => {
  return <AudioTimelineNav {...props} />;
};

export default AudioTimelineNavContainer;
