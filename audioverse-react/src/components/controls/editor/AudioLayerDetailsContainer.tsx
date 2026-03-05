import React from "react";
import AudioLayerDetailsComponent from "./AudioLayerDetails";
import { AudioLayer } from "../../../models/modelsEditor";

interface AudioLayerDetailsContainerProps {
  layer: AudioLayer;
  onLayerChange: (layer: AudioLayer) => void;
  onSave?: (layer: AudioLayer) => void;
}

const AudioLayerDetailsContainer: React.FC<AudioLayerDetailsContainerProps> = (props) => {
  return <AudioLayerDetailsComponent {...props} />;
};

export default AudioLayerDetailsContainer;
