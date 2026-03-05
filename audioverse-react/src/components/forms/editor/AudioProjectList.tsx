import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { getProjects } from "../../../scripts/api/apiEditor";
import { AudioProject } from "../../../models/modelsEditor.ts";

const AudioProjectList = () => {
    const [projects, setProjects] = useState<AudioProject[]>([]);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        const data = await getProjects();
        setProjects(data);
    };

    const handleProjectClick = (projectId: number) => {
        navigate(`/create/studio/${projectId}`);
    };

    return (
        <div>
            <h2>{t('projectList.title', 'Project List')}</h2>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px"
            }}>
                {projects.map((project) => (
                    <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        style={{
                            padding: "10px",
                            fontSize: "16px",
                            cursor: "pointer",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            textAlign: "left"
                        }}
                    >
                        {project.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AudioProjectList;
