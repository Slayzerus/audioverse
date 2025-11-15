import { AudioClip } from "../../../models/modelsEditor.ts";

interface Props {
    clip: AudioClip;
    onSelect?: (clip: AudioClip) => void;
}

const AudioClipBox: React.FC<Props> = ({ clip, onSelect }) => {
    return (
        <div style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "#f9f9f9",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
        }}>
            <h3>{clip.fileName}</h3>
            <p>Format: {clip.fileFormat}</p>
            <p>Rozmiar: {clip.size} bajtów</p>
            {onSelect && (
                <button onClick={() => onSelect(clip)} style={{
                    marginTop: "10px",
                    padding: "5px 10px",
                    backgroundColor: "blue",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                }}>
                    🎵 Select
                </button>
            )}
        </div>
    );
};

export default AudioClipBox;
