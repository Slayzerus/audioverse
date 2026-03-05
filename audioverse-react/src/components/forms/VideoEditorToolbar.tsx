/**
 * VideoEditorToolbar — top toolbar for the video editor.
 */

import React from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { VideoEditorAPI } from "./useVideoEditor";
import s from "./VideoEditor.module.css";

interface Props {
    api: VideoEditorAPI;
}

const VideoEditorToolbar: React.FC<Props> = ({ api }) => {
    const { accent, handleReset, handleDownload, handleShareNative, onCancel, handleSave } = api;
    const { t } = useTranslation();

    return (
        <div className={s.toolbar}>
            <div className={s.toolbarGroup}>
                <Button variant="dark" size="sm" onClick={handleReset} title={t("videoEditor.reset", "Reset")}>
                    <i className="fa fa-refresh" />
                </Button>
                <div className={s.toolbarDivider} />
                <Button variant="dark" size="sm" onClick={handleDownload} title={t("common.download", "Download")}>
                    <i className="fa fa-download" />
                </Button>
                <Button variant="dark" size="sm" onClick={handleShareNative} title={t("common.share", "Share")}>
                    <i className="fa fa-share-alt" />
                </Button>
            </div>

            <div className={s.toolbarTitle} style={{ color: accent }}>
                <i className="fa fa-film me-2" />
                {t("videoEditor.title", "Video Editor")}
            </div>

            <div className={s.toolbarGroup}>
                <Button variant="outline-secondary" size="sm" onClick={onCancel}>
                    <i className="fa fa-times me-1" /> {t("common.cancel", "Cancel")}
                </Button>
                <Button size="sm" className={s.saveBtn} style={{ background: accent, borderColor: accent }} onClick={handleSave}>
                    <i className="fa fa-check me-1" /> {t("videoEditor.apply", "Apply")}
                </Button>
            </div>
        </div>
    );
};

export default React.memo(VideoEditorToolbar);
