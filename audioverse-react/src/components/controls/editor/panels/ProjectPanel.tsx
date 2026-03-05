import React from "react";
import type { AudioProject } from "../../../../models/modelsEditor";

interface ProjectPanelProps {
    project: AudioProject;
    projectName: string;
    setProjectName: (v: string) => void;
    projectIsTemplate: boolean;
    setProjectIsTemplate: (v: boolean) => void;
    projectVolume: string;
    setProjectVolume: (v: string) => void;
    handleSaveProject: () => void;
    bounceProject: () => void;
    saveTemplate: () => void;
    loadTemplate: () => void;
    exportProject: () => void;
    importInputRef: { current: HTMLInputElement | null };
    importProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProjectPanel: React.FC<ProjectPanelProps> = ({
    projectName,
    setProjectName,
    projectIsTemplate,
    setProjectIsTemplate,
    projectVolume,
    setProjectVolume,
    handleSaveProject,
    bounceProject,
    saveTemplate,
    loadTemplate,
    exportProject,
    importInputRef,
    importProject,
}) => (
    <div className="card p-3 mb-3" style={{ maxWidth: 520 }}>
        <h5 className="mb-3">Project</h5>
        <div className="mb-2">
            <label className="form-label">Name</label>
            <input className="form-control" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </div>
        <div className="mb-2 form-check">
            <input
                id="project-template"
                type="checkbox"
                className="form-check-input"
                checked={projectIsTemplate}
                onChange={(e) => setProjectIsTemplate(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="project-template">Is template</label>
        </div>
        <div className="mb-2">
            <label className="form-label">Volume</label>
            <input
                className="form-control"
                type="number"
                step="0.1"
                value={projectVolume}
                onChange={(e) => setProjectVolume(e.target.value)}
                placeholder="e.g. 0.8"
            />
        </div>
        <div className="d-flex gap-2 mb-2 flex-wrap">
            <button className="btn btn-outline-secondary" onClick={saveTemplate} title="Save current project as template">
                💾 Save as template
            </button>
            <button className="btn btn-outline-secondary" onClick={loadTemplate} title="Load project template (overwrites current project)">
                📂 Load template
            </button>
            <button className="btn btn-outline-secondary" onClick={exportProject} title="Export project to JSON file">
                <i className="fa-solid fa-arrow-down" />{" "}Export project
            </button>
            <button className="btn btn-outline-secondary" onClick={() => importInputRef?.current?.click()} title="Import project from JSON file">
                <i className="fa-solid fa-arrow-up" />{" "}Import project
            </button>
            <input
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                ref={importInputRef as React.Ref<HTMLInputElement>}
                onChange={importProject}
            />
        </div>
        <button className="btn btn-primary" onClick={handleSaveProject} title="Save project to server (PUT)">
            Save project (PUT)
        </button>
        <button className="btn btn-success ms-2" onClick={bounceProject} title="Export mix to WAV file (bounce, offline render)">
            <i className="fa-solid fa-music" />{" "}Bounce (export WAV)
        </button>
    </div>
);
