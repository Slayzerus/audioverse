import React from "react";
import { AudioProject } from "../../../../scripts/audioProject.ts";

interface AudioProjectNavProps {
    projects: AudioProject[];
    activeProject: string;
    onSelectProject: (project: string) => void;
}

const AudioProjectNav: React.FC<AudioProjectNavProps> = ({ projects, activeProject, onSelectProject }) => {
    return (
        <div className="project-nav">
            {projects.map((project) => (
                <button
                    key={project.name}
                    className={`project-button ${activeProject === project.name ? "active" : ""}`}
                    onClick={() => onSelectProject(project.name)}
                >
                    {project.name}
                </button>
            ))}
        </div>
    );
};

export default AudioProjectNav;
