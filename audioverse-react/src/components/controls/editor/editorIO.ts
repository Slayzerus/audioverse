import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { AudioProject } from "../../../models/modelsEditor";
import { setProjectWithUndo } from '../../../utils/undoRedoUtils';

type StatusSetter = Dispatch<SetStateAction<string>>;
type StatusTypeSetter = Dispatch<SetStateAction<"success" | "error" | "">>;

export function exportProject(project: AudioProject | null, projectName: string): void {
    if (!project) return;
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = (projectName || 'audioverse_project') + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

export function importProject(
    e: ChangeEvent<HTMLInputElement>,
    project: AudioProject | null,
    setUndoStack: Dispatch<SetStateAction<AudioProject[]>>,
    setRedoStack: Dispatch<SetStateAction<AudioProject[]>>,
    setProject: Dispatch<SetStateAction<AudioProject | null>>,
    setStatusMessage: StatusSetter,
    setStatusType: StatusTypeSetter,
    t: TFunction,
): void {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
        try {
            const json = JSON.parse(evt.target?.result as string);
            setProjectWithUndo(json, project, setUndoStack, setRedoStack, setProject);
            setStatusMessage(t('editor.importedProject')); setStatusType('success');
            setTimeout(() => setStatusMessage(''), 2000);
        } catch (err) {
            setStatusMessage(t('editor.importError', { error: (err as Error).message })); setStatusType('error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

export function saveTemplate(
    project: AudioProject | null,
    setStatusMessage: StatusSetter,
    setStatusType: StatusTypeSetter,
    t: TFunction,
): void {
    if (!project) return;
    try {
        localStorage.setItem('audioEditor.template', JSON.stringify(project));
        setStatusMessage(t('editor.templateSaved')); setStatusType('success');
        setTimeout(() => setStatusMessage(''), 2000);
    } catch (e) {
        setStatusMessage(t('editor.templateSaveError', { error: (e as Error).message })); setStatusType('error');
    }
}

export function loadTemplate(
    project: AudioProject | null,
    setUndoStack: Dispatch<SetStateAction<AudioProject[]>>,
    setRedoStack: Dispatch<SetStateAction<AudioProject[]>>,
    setProject: Dispatch<SetStateAction<AudioProject | null>>,
    setStatusMessage: StatusSetter,
    setStatusType: StatusTypeSetter,
    t: TFunction,
): void {
    try {
        const tpl = localStorage.getItem('audioEditor.template');
        if (!tpl) { setStatusMessage(t('editor.noTemplate')); setStatusType('error'); return; }
        const parsed = JSON.parse(tpl);
        setProjectWithUndo(parsed, project, setUndoStack, setRedoStack, setProject);
        setStatusMessage(t('editor.templateLoaded')); setStatusType('success');
        setTimeout(() => setStatusMessage(''), 2000);
    } catch (e) {
        setStatusMessage(t('editor.templateLoadError', { error: (e as Error).message })); setStatusType('error');
    }
}
