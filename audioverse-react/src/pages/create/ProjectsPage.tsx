import React, { useState } from "react";
import AudioProjectList from "../../components/forms/editor/AudioProjectList.tsx";
import AudioProjectForm from "../../components/forms/editor/AudioProjectForm.tsx";
import { useTranslation } from "react-i18next";

const ProjectsPage: React.FC = () => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Key to force list refresh

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleCreate = () => {
        setRefreshKey((prevKey) => prevKey + 1); // Forces list re-rendering
        closeModal();
    };

    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column"
        }}>
            <h1>{t('projectsPage.title', 'Projects List')}</h1>
            <button onClick={openModal} style={{
                padding: "10px 20px",
                fontSize: "16px",
                cursor: "pointer",
                marginBottom: "20px"
            }}>
                ➕ {t('projectsPage.addProject', 'Add Project')}
            </button>

            <AudioProjectList key={refreshKey} /> {/* Forces project list refresh */}

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    backgroundColor: "var(--overlay-bg, rgba(0, 0, 0, 0.5))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-primary, black)"
                }}>
                    <div style={{
                        backgroundColor: "var(--card-bg, white)",
                        padding: "20px",
                        borderRadius: "8px",
                        width: "90vw",
                        maxWidth: "400px",
                        boxShadow: "var(--modal-shadow, 0 4px 8px rgba(0, 0, 0, 0.3))"
                    }}>
                        <AudioProjectForm
                            onCancel={closeModal}
                            onCreate={handleCreate}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;
