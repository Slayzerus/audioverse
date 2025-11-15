import React from "react";
import { AudioProject, AudioSection } from "../../../../models/modelsEditor.ts";

interface AudioProjectSectionNavProps {
    activeProject: AudioProject;
    activeSection: AudioSection | null;
    onSelectSection: (section: AudioSection) => void;
    onAddSection: () => void;
}

const AudioProjectSectionNav: React.FC<AudioProjectSectionNavProps> = ({ activeProject, activeSection, onSelectSection, onAddSection }) => {
    return (
        <div className="section-nav" style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {activeProject.sections?.map((section: AudioSection) => (
                <button
                    key={section.id}
                    className={`section-button ${activeSection?.id === section.id ? "active" : ""}`}
                    onClick={() => onSelectSection(section)}
                >
                    {section.name}
                </button>
            ))}
            {/* 🔹 Przycisk dodawania nowej sekcji */}
            <button
                className="section-button add-section"
                onClick={onAddSection}
                style={{
                    padding: "5px 10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                }}
            >
                ➕
            </button>
        </div>
    );
};

export default AudioProjectSectionNav;
