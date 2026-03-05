import { useState } from "react";
import { useTranslation } from "react-i18next";
import { addProject/*, getProjects*/ } from "../../../scripts/api/apiEditor";
/*import { AudioProject } from "../../../models/editorModels";*/

interface AudioProjectFormProps {
    onCancel: () => void;
    onCreate: () => void;
}

const AudioProjectForm: React.FC<AudioProjectFormProps> = ({ onCancel, onCreate }) => {
    const { t } = useTranslation();
    const [name, setName] = useState("");

    const handleAddProject = async () => {
        if (!name.trim()) return;
        await addProject(name, 1); // userProfileId = 1 (przykładowo)
        setName("");
        onCreate(); // Powiadomienie o stworzeniu projektu
    };

    return (
        <div>
            <h2>{t('audioProjectForm.title')}</h2>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('audioProjectForm.placeholderName')}
                style={{color:"black"}}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button className="btn btn-danger" onClick={onCancel}>{t('audioProjectForm.cancel')}</button>
                <button className="btn btn-success" onClick={handleAddProject}>{t('audioProjectForm.create')}</button>
            </div>
        </div>
    );
};

export default AudioProjectForm;
