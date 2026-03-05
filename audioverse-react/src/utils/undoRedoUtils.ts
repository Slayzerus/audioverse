// Undo/redo utilities for AudioProject
import { AudioProject } from '../models/modelsEditor';

export function setProjectWithUndo(
    next: AudioProject,
    project: AudioProject | null,
    setUndoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>,
    setRedoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>,
    setProject: React.Dispatch<React.SetStateAction<AudioProject | null>>
) {
    setUndoStack(stack => (project ? [...stack, project] : stack));
    setRedoStack([]);
    setProject(next);
}

export function handleUndo(
    project: AudioProject | null,
    setUndoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>,
    setRedoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>,
    setProject: React.Dispatch<React.SetStateAction<AudioProject | null>>
) {
    setUndoStack(stack => {
        if (stack.length === 0) return stack;
        const prev = stack[stack.length - 1];
        setRedoStack(rstack => (project ? [project, ...rstack] : rstack));
        setProject(prev);
        return stack.slice(0, -1);
    });
}

export function handleRedo(
    project: AudioProject | null,
    setUndoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>,
    setRedoStack: React.Dispatch<React.SetStateAction<AudioProject[]>>,
    setProject: React.Dispatch<React.SetStateAction<AudioProject | null>>
) {
    setRedoStack(stack => {
        if (stack.length === 0) return stack;
        const next = stack[0];
        setUndoStack(ustack => (project ? [...ustack, project] : ustack));
        setProject(next);
        return stack.slice(1);
    });
}
