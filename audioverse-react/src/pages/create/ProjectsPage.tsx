import React, { useState } from "react";
import AudioProjectList from "../../components/forms/editor/AudioProjectList.tsx";
import AudioProjectForm from "../../components/forms/editor/AudioProjectForm.tsx";

const ProjectsPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Klucz do wymuszenia odświeżenia listy

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleCreate = () => {
        setRefreshKey((prevKey) => prevKey + 1); // Wymusza ponowne renderowanie listy
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
            <h1>Lista Projektów</h1>
            <button onClick={openModal} style={{
                padding: "10px 20px",
                fontSize: "16px",
                cursor: "pointer",
                marginBottom: "20px"
            }}>
                ➕ Dodaj Projekt
            </button>

            <AudioProjectList key={refreshKey} /> {/* Wymusza odświeżenie listy projektów */}

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "black"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        width: "400px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)"
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
