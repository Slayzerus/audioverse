import { useCallback } from "react";
import {
    addSection,
    addLayer,
    deleteSection,
    deleteLayer,
    updateProject,
    updateSection,
} from "../../../../scripts/api/apiEditor";
import { AudioSourceType } from "../../../../scripts/audioSource";
import { setProjectWithUndo } from "../../../../utils/undoRedoUtils";
import type { AudioProject, AudioSection, AudioLayer } from "../../../../models/modelsEditor";
import type { ClipRegion, LayerSettings, ClipId } from "../../../../models/editor/audioTypes";
import type { MidiNote } from "../../../../models/editor/midiTypes";
import { logger } from "../../../../utils/logger";
const log = logger.scoped('useProjectCRUD');

export interface ProjectCRUDDeps {
    project: AudioProject | null;
    activeSection: AudioSection | null;
    setProject: React.Dispatch<React.SetStateAction<AudioProject | null>>;
    setActiveSection: React.Dispatch<React.SetStateAction<AudioSection | null>>;
    setLayers: React.Dispatch<React.SetStateAction<AudioLayer[]>>;
    setActiveLayer: React.Dispatch<React.SetStateAction<AudioLayer | null>>;
    setUndoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>;
    setRedoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>;
    projectName: string;
    projectIsTemplate: boolean;
    projectVolume: string;
    sectionName: string;
    sectionOrder: string;
    setStatusMessage: (msg: string) => void;
    setStatusType: (t: "success" | "error" | "") => void;
    layerSettings: Record<number, LayerSettings>;
    layerClips: Record<number, ClipRegion[]>;
    layerMidiNotes: Record<number, MidiNote[]>;
    setLayerMidiNotes: React.Dispatch<React.SetStateAction<Record<number, MidiNote[]>>>;
    removeEngineClip: (layerId: number, clipId: ClipId) => void;
    confirm: (msg: string) => Promise<boolean>;
    showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

/**
 * Hook encapsulating project/section/layer CRUD operations.
 */
export function useProjectCRUD(deps: ProjectCRUDDeps) {
    const {
        project,
        activeSection,
        setProject,
        setActiveSection,
        setLayers,
        setActiveLayer,
        setUndoStack,
        setRedoStack,
    } = deps;

    const withUndo = useCallback(
        (next: AudioProject) => setProjectWithUndo(next, project, setUndoStack, setRedoStack, setProject),
        [project, setUndoStack, setRedoStack, setProject],
    );

    const handleAddSection = useCallback(async () => {
        if (!project) return;
        const order = (project.sections?.length ?? 0) + 1;
        const newSectionId = await addSection(project.id, "Section", order);
        const newSection: AudioSection = {
            id: newSectionId,
            projectId: project.id,
            name: "Section",
            orderNumber: order,
            layers: [],
        };
        withUndo({ ...project, sections: [...(project.sections || []), newSection] });
        setActiveSection(newSection);
    }, [project, withUndo, setActiveSection]);

    const handleDeleteSection = useCallback(
        async (sectionId: number) => {
            if (!project) return;
            const ok = await deps.confirm("Usunąć sekcję?");
            if (!ok) return;
            await deleteSection(sectionId);
            const remaining = (project.sections ?? []).filter((s) => s.id !== sectionId);
            withUndo({ ...project, sections: remaining });
            setActiveSection(remaining[0] ?? null);
            setLayers(remaining[0]?.layers ?? []);
            setActiveLayer(remaining[0]?.layers?.[0] ?? null);
        },
        [project, withUndo, setActiveSection, setLayers, setActiveLayer, deps],
    );

    const handleAddLayer = useCallback(async () => {
        if (!activeSection) return;
        const optimistic: AudioLayer = {
            id: -Date.now(),
            name: "New Layer",
            sectionId: activeSection.id,
            audioSource: AudioSourceType.AudioClip,
            audioSourceParameters: JSON.stringify({ clipId: null }),
            items: [],
        };
        setLayers((prev) => [...prev, optimistic]);
        setActiveLayer(optimistic);
        try {
            const newId = await addLayer(
                activeSection.id,
                optimistic.name,
                optimistic.audioSource,
                optimistic.audioSourceParameters,
            );
            setLayers((prev) => prev.map((l) => (l.id === optimistic.id ? { ...optimistic, id: newId } : l)));
            if (project) {
                withUndo({
                    ...project,
                    sections:
                        project.sections?.map((s) =>
                            s.id === activeSection.id
                                ? { ...s, layers: [...(s.layers ?? []).filter((l) => l.id !== newId), { ...optimistic, id: newId }] }
                                : s,
                        ) ?? [],
                });
            }
        } catch (e) {
            setLayers((prev) => prev.filter((l) => l.id !== optimistic.id));
            log.error("Nie udało się dodać warstwy:", e);
        }
    }, [activeSection, project, withUndo, setLayers, setActiveLayer]);

    const handleDeleteLayer = useCallback(
        async (layerId: number) => {
            if (deps.layerSettings[layerId]?.locked) {
                deps.showToast("Warstwa jest zablokowana (Lock). Odblokuj aby usunąć.", "error");
                return;
            }
            const ok = await deps.confirm("Usunąć warstwę?");
            if (!ok) return;
            (deps.layerClips[layerId] || []).forEach((clip) => deps.removeEngineClip(layerId, clip.id));
            deps.setLayerMidiNotes((prev) => {
                const next = { ...prev };
                delete next[layerId];
                return next;
            });
            await deleteLayer(layerId);
            setLayers((prev) => prev.filter((l) => l.id !== layerId));
            setActiveLayer((prev) => (prev?.id === layerId ? null : prev));
            if (project) {
                withUndo({
                    ...project,
                    sections:
                        project.sections?.map((s) =>
                            s.id === activeSection?.id
                                ? { ...s, layers: (s.layers ?? []).filter((l) => l.id !== layerId) }
                                : s,
                        ) ?? [],
                });
            }
        },
        [project, activeSection, withUndo, setLayers, setActiveLayer, deps],
    );

    const handleSaveProject = useCallback(async () => {
        if (!project) return;
        const nextVolume = deps.projectVolume === "" ? undefined : Number(deps.projectVolume);
        if (Number.isNaN(nextVolume as number)) {
            deps.setStatusType("error");
            deps.setStatusMessage("Volume musi być liczbą");
            return;
        }
        if (!deps.projectName.trim()) {
            deps.setStatusType("error");
            deps.setStatusMessage("Nazwa projektu nie może być pusta");
            return;
        }
        await updateProject(project.id, {
            name: deps.projectName || project.name,
            isTemplate: deps.projectIsTemplate,
            volume: nextVolume,
        });
        withUndo({
            ...project,
            name: deps.projectName || project.name,
            isTemplate: deps.projectIsTemplate,
            volume: nextVolume,
        });
        deps.setStatusType("success");
        deps.setStatusMessage("Projekt zapisany");
    }, [project, deps, withUndo]);

    const handleSaveSection = useCallback(async () => {
        if (!activeSection) return;
        const nextName = deps.sectionName || activeSection.name;
        const nextOrder = deps.sectionOrder === "" ? activeSection.orderNumber : Number(deps.sectionOrder);
        if (!nextName.trim()) {
            deps.setStatusType("error");
            deps.setStatusMessage("Nazwa sekcji nie może być pusta");
            return;
        }
        if (Number.isNaN(nextOrder)) {
            deps.setStatusType("error");
            deps.setStatusMessage("Order musi być liczbą");
            return;
        }
        await updateSection(activeSection.id, { name: nextName, orderNumber: nextOrder });
        setActiveSection({ ...activeSection, name: nextName, orderNumber: nextOrder });
        if (project) {
            withUndo({
                ...project,
                sections:
                    project.sections?.map((s) =>
                        s.id === activeSection.id ? { ...s, name: nextName, orderNumber: nextOrder } : s,
                    ) ?? [],
            });
        }
        deps.setStatusType("success");
        deps.setStatusMessage("Sekcja zapisana");
    }, [activeSection, project, deps, withUndo, setActiveSection]);

    return {
        handleAddSection,
        handleDeleteSection,
        handleAddLayer,
        handleDeleteLayer,
        handleSaveProject,
        handleSaveSection,
    };
}
