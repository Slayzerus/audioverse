import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProjectDetails, addSection, addLayer } from "../../../scripts/api/apiEditor";
import { AudioProject, AudioSection, AudioLayer } from "../../../models/modelsEditor.ts";
import AudioProjectSectionNav from "./nav/AudioProjectSectionNav";
import AudioTimeline from "./AudioTimeline";
import AudioTimelineNav from "./nav/AudioTimelineNav";
import AudioLayersNav from "./nav/AudioLayersNav";
import SaveLoadControls from "./nav/SaveLoadControls";
import AudioLayerDetailsComponent from "./AudioLayerDetails";
import {AudioSourceType} from "../../../scripts/audioSource.ts";
import Oxygen25Demo from "../input/source/Oxygen25Demo.tsx";

const AudioEditor: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<AudioProject | null>(null);
    const [activeSection, setActiveSection] = useState<AudioSection | null>(null);
    const [layers, setLayers] = useState<AudioLayer[]>([]);
    const [activeLayer, setActiveLayer] = useState<AudioLayer | null>(null);

    // 📌 Pobranie projektu po ID
    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;
            const projectData = await getProjectDetails(parseInt(projectId));
            setProject(projectData);
            setActiveSection(projectData.sections?.[0] || null);
        };
        fetchProject();
    }, [projectId]);

    // 📌 Pobranie warstw aktywnej sekcji
    useEffect(() => {
        if (activeSection) {
            setLayers(activeSection.layers || []);
            setActiveLayer(activeSection.layers?.[0] || null); // Ustawienie pierwszej warstwy jako aktywnej
        }
    }, [activeSection]);

    const handleLoadProject = (loadedProject: AudioProject) => {
        setProject(loadedProject);
        setActiveSection(loadedProject.sections?.[0] || null);
    };

    // 📌 Dodawanie nowej sekcji
    const handleAddSection = async () => {
        if (!project) return;
        const order = (project.sections?.length ?? 0) + 1; // ✅ zamiast: project.sections?.length || 0 + 1
        const newSectionId = await addSection(project.id, "Section", order);

        const newSection: AudioSection = {
            id: newSectionId,
            projectId: project.id,
            name: "Section",
            orderNumber: order,
            layers: [],
        };

        const updatedProject = {
            ...project,
            sections: [...(project.sections || []), newSection],
        };

        setProject(updatedProject);
        setActiveSection(newSection);
    };


    // 📌 Dodawanie nowej warstwy
    // ...
    const handleAddLayer = async () => {
        if (!activeSection) return;

        // handleAddLayer (tworzenie optymistycznej warstwy)
        const optimistic: AudioLayer = {
            id: -Date.now(),
            name: "New Layer",
            sectionId: activeSection.id,
            audioSource: AudioSourceType.AudioClip,  // ⬅️ domyślnie „Audio Clip” zamiast pusty string
            audioSourceParameters: JSON.stringify({ clipId: null }),
            items: [],
        };


        // Pokaż od razu
        setLayers((prev) => [...prev, optimistic]);
        setActiveLayer(optimistic);

        try {
            const newId = await addLayer(activeSection.id, optimistic.name, optimistic.audioSource, optimistic.audioSourceParameters);

            // Podmień ghosta na właściwy rekord
            setLayers((prev) =>
                prev.map((l) => (l.id === optimistic.id ? { ...optimistic, id: newId } : l))
            );

            // (opcjonalnie) zsynchronizuj także project→sections
            setProject((p) =>
                p
                    ? {
                        ...p,
                        sections:
                            p.sections?.map((s) =>
                                s.id === activeSection.id
                                    ? { ...s, layers: [...(s.layers ?? []), { ...optimistic, id: newId }] }
                                    : s
                            ) ?? [],
                    }
                    : p
            );
        } catch (e) {
            // Rollback optymistyka
            setLayers((prev) => prev.filter((l) => l.id !== optimistic.id));
            console.error("Nie udało się dodać warstwy:", e);
            // tu możesz odpalić toast/alert
        }
    };


    return (
        <div className="audio-editor">

            <SaveLoadControls project={project} onLoadProject={handleLoadProject} />

            {project && (
                <AudioProjectSectionNav
                    activeProject={project}
                    activeSection={activeSection}
                    onSelectSection={(section) => setActiveSection(section)}
                    onAddSection={handleAddSection}
                />
            )}

            {/* 🔹 Nawigacja Timeline */}
            <AudioTimelineNav
                isPlaying={false}
                isLooping={false}
                currentTime={0}
                duration={10}
                onPlayPause={() => {}}
                onRecord={() => {}}
                onLoop={() => {}}
                onAdjustDuration={() => {}}
            />

            <AudioLayersNav
                onAddLayer={handleAddLayer}
                onLoadPreset={() => {}}
                onSavePreset={() => {}}
            />

            {/* 🔹 Lista warstw */}
            <div className="layer-selection">
                {layers.map((layer) => (
                    <div key={layer.id} className="audio-timeline">
                        <button
                            className={`layer-button ${activeLayer?.id === layer.id ? "active-layer" : ""}`}
                            onClick={() => setActiveLayer(layer)}
                        >
                            {layer.audioSource || "New Layer"}
                        </button>
                        <AudioTimeline
                            zoom={1}
                            duration={10}
                            isPlaying={false}
                            isRecording={false}
                            currentTime={0}
                            onCurrentTimeChange={() => {}}
                        />
                    </div>
                ))}
            </div>

            {/* 🔹 Szczegóły aktywnej warstwy */}
            {activeLayer && (
                <AudioLayerDetailsComponent
                    layer={activeLayer}
                    onLayerChange={(updatedLayer) =>
                        setLayers(layers.map((l) => (l.id === updatedLayer.id ? updatedLayer : l)))
                    }
                />
            )}

            <Oxygen25Demo />
        </div>
    );
};

export default AudioEditor;
