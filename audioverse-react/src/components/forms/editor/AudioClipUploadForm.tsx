import { useState } from "react";
import { addAudioClip } from "../../../scripts/api/apiEditor";

const AudioClipUploadForm = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async () => {
        if (!file) return;
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async () => {
            const audioClip = {
                fileName: file.name,
                fileFormat: file.type,
                data: new Uint8Array(reader.result as ArrayBuffer),
                duration: "00:00:30", // Przykładowa wartość
                size: file.size
            };
            await addAudioClip(audioClip);
            alert("AudioClip dodany!");
        };
    };

    return (
        <div>
            <h2>Dodaj AudioClip</h2>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={handleUpload}>Prześlij</button>
        </div>
    );
};

export default AudioClipUploadForm;
