import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFolderOpen, faSave } from "@fortawesome/free-solid-svg-icons";

interface Props {
    onAddLayer: () => void;
    onLoadPreset: () => void;
    onSavePreset: () => void;
}

const AudioLayersNav: React.FC<Props> = ({ onAddLayer, onLoadPreset, onSavePreset }) => {
    return (
        <div style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            color: "white",
            gap: "5px"
        }}>
            <button onClick={onAddLayer} title="Add Layer" className="add-layer-button">
                <FontAwesomeIcon icon={faPlus} size="lg" />
            </button>

            <button onClick={onLoadPreset} title="Load Preset" className="add-layer-button">
                <FontAwesomeIcon icon={faFolderOpen} size="lg" />
            </button>

            <button onClick={onSavePreset} title="Save Preset" className="add-layer-button">
                <FontAwesomeIcon icon={faSave} size="lg" />
            </button>
        </div>
    );
};

export default AudioLayersNav;
