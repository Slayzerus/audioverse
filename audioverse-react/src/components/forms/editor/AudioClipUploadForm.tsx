import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { addAudioClip } from "../../../scripts/api/apiEditor";
import { useToast } from "../../ui/ToastProvider";

const AudioClipUploadForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const { t } = useTranslation();

    const { showToast } = useToast();

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
            showToast(t('clipUpload.added', 'AudioClip added!'), 'success');
        };
    };

    return (
        <div>
            <h2>{t('clipUpload.title', 'Add AudioClip')}</h2>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={handleUpload}>{t('clipUpload.upload', 'Upload')}</button>
        </div>
    );
};

export default AudioClipUploadForm;
