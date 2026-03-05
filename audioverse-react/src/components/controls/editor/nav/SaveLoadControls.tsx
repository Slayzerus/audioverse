import React, { useRef } from "react";
import { useTranslation } from 'react-i18next';
import { AudioProject } from "../../../../models/modelsEditor.ts";
import { logger } from "../../../../utils/logger";
const log = logger.scoped('SaveLoadControls');

interface SaveLoadControlsProps {
    project: AudioProject | null;
    onLoadProject: (project: AudioProject) => void;
}

const SaveLoadControls: React.FC<SaveLoadControlsProps> = ({ project, onLoadProject }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    // 📌 Zapis do pliku JSON
    const handleSave = () => {
        if (!project) return;
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `${project.name.replace(/\s+/g, "_")}.json`; // Filename matching the project name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 📌 Wczytanie pliku JSON
    const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                try {
                    const loadedProject: AudioProject = JSON.parse(e.target.result as string);
                    onLoadProject(loadedProject);
                } catch (error) {
                    log.error("Error loading project:", error);
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button onClick={handleSave} className="btn btn-success">{t('saveLoad.save', '💾 Save')}</button>
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">{t('saveLoad.load', '📂 Load')}</button>
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleLoad}
            />
        </div>
    );
};

export default React.memo(SaveLoadControls);
