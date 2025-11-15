import { useEffect, useState } from "react";
import { getAudioClips } from "../../scripts/api/apiEditor";
import AudioClipBox from "../controls/editor/AudioClipBox";
import { AudioClip } from "../../models/modelsEditor.ts";


interface Props {
    onSelect?: (clip: AudioClip) => void;
}

const AudioClipList: React.FC<Props> = ({ onSelect }) => {
    const [clips, setClips] = useState<AudioClip[]>([]);

    useEffect(() => {
        fetchClips();
    }, []);

    const fetchClips = async () => {
        const data = await getAudioClips(0, 10);
        setClips(data);
    };

    return (
        <div>
            <h2>Lista AudioClipów</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px"
            }}>
                {clips.map((clip) => (
                    <AudioClipBox key={clip.id} clip={clip} onSelect={onSelect} />
                ))}
            </div>
        </div>
    );
};

export default AudioClipList;
