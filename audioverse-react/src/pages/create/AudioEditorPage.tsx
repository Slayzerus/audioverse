import React from "react";
import AudioEditor from "../../components/controls/editor/AudioEditor.tsx";

const AudioEditorPage: React.FC = () => {
    return (
        <div>
            <div style={{ textAlign: "center", width:"100%", backgroundColor:"black", color:"white" }}>
                Verse Editor v0.01
            </div>
            <AudioEditor/>
        </div>
    );
};

export default AudioEditorPage;
