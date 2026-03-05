import React from "react";
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFolderOpen, faSave } from "@fortawesome/free-solid-svg-icons";
import styles from '../../AudioEditor.module.css';

interface Props {
    onAddLayer: () => void;
    onLoadPreset: () => void;
    onSavePreset: () => void;
}

const AudioLayersNav: React.FC<Props> = ({ onAddLayer, onLoadPreset, onSavePreset }) => {
    const { t } = useTranslation();
    return (
        <div style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            color: "white",
            gap: "5px"
        }}>
            <button onClick={onAddLayer} title={t('audioLayersNav.addLayer', 'Add Layer')} className={styles['add-layer-button']}>
                <FontAwesomeIcon icon={faPlus} size="lg" />
            </button>

            <button onClick={onLoadPreset} title={t('audioLayersNav.loadPreset', 'Load Preset')} className={styles['add-layer-button']}>
                <FontAwesomeIcon icon={faFolderOpen} size="lg" />
            </button>

            <button onClick={onSavePreset} title={t('audioLayersNav.savePreset', 'Save Preset')} className={styles['add-layer-button']}>
                <FontAwesomeIcon icon={faSave} size="lg" />
            </button>
        </div>
    );
};

export default React.memo(AudioLayersNav);
