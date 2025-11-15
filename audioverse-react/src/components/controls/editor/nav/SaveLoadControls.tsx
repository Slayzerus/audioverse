import React, { useRef } from "react";
import { AudioProject } from "../../../../models/modelsEditor.ts";

interface SaveLoadControlsProps {
    project: AudioProject | null;
    onLoadProject: (project: AudioProject) => void;
}

const SaveLoadControls: React.FC<SaveLoadControlsProps> = ({ project, onLoadProject }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 📌 Zapis do pliku JSON
    const handleSave = () => {
        if (!project) return;
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `${project.name.replace(/\s+/g, "_")}.json`; // Nazwa pliku zgodna z nazwą projektu
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
                    console.error("Błąd wczytywania projektu:", error);
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button onClick={handleSave} className="btn btn-success">💾 Save</button>
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">📂 Load</button>
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

export default SaveLoadControls;
