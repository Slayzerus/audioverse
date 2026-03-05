import React from "react";
import AudioLayersNav from "./nav/AudioLayersNav";

interface AudioLayersNavContainerProps {
  onAddLayer: () => void;
  onLoadPreset: () => void;
  onSavePreset: () => void;
}

const AudioLayersNavContainer: React.FC<AudioLayersNavContainerProps> = (props) => {
  return <AudioLayersNav {...props} />;
};

export default AudioLayersNavContainer;
