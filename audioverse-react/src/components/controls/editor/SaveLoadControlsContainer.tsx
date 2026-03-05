import React from "react";
import SaveLoadControls from "./nav/SaveLoadControls";
import { AudioProject } from "../../../models/modelsEditor";

interface SaveLoadControlsContainerProps {
  project: AudioProject | null;
  onLoadProject: (project: AudioProject) => void;
}

const SaveLoadControlsContainer: React.FC<SaveLoadControlsContainerProps> = (props) => {
  return <SaveLoadControls {...props} />;
};

export default SaveLoadControlsContainer;
