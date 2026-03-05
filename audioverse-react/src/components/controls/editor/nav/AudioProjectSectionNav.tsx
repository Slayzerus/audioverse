import React from "react";
import { useTranslation } from 'react-i18next';
import { AudioProject, AudioSection } from "../../../../models/modelsEditor.ts";
import styles from '../../AudioEditor.module.css';

interface AudioProjectSectionNavProps {
    activeProject: AudioProject;
    activeSection: AudioSection | null;
    onSelectSection: (section: AudioSection) => void;
    onAddSection: () => void;
    onDeleteSection?: (sectionId: number) => void;
}

const AudioProjectSectionNav: React.FC<AudioProjectSectionNavProps> = ({ activeProject, activeSection, onSelectSection, onAddSection, onDeleteSection }) => {
    const { t } = useTranslation();
    return (
        <div className={styles['section-nav']} style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {activeProject.sections?.map((section: AudioSection) => (
                <div key={section.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                        className={`${styles['section-button']} ${activeSection?.id === section.id ? styles.active : ''}`}
                        onClick={() => onSelectSection(section)}
                    >
                        {section.name}
                    </button>
                    {onDeleteSection && (
                        <button
                            title={t('sectionNav.deleteSection', 'Delete section')}
                            style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #ccc", background: "#fff" }}
                            onClick={() => onDeleteSection(section.id)}
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}
            {/* 🔹 Przycisk dodawania nowej sekcji */}
            <button
                className={`${styles['section-button']} add-section`}
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
