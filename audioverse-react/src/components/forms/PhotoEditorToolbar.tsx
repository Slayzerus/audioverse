/**
 * PhotoEditorToolbar.tsx — Top toolbar for the PhotoEditor.
 *
 * Includes undo / redo / reset, compare toggle, download / clipboard / share,
 * title, cancel and save (apply) buttons.
 */

import React from "react";
import { Button } from "react-bootstrap";
import type { PhotoEditorAPI } from "./usePhotoEditor";
import cs from "./PhotoEditor.module.css";

interface Props {
    api: PhotoEditorAPI;
}

const PhotoEditorToolbar: React.FC<Props> = React.memo(({ api }) => {
    const {
        t, accent, historyIdx, historyLength,
        undo, redo, handleReset,
        showCompare, setShowCompare,
        handleDownload, handleCopyToClipboard, handleShareNative,
        onCancel, handleSave,
    } = api;

    return (
        <div className={cs.toolbar}>
            <div className={cs.toolbarGroup}>
                <Button variant="dark" size="sm" onClick={undo} disabled={historyIdx <= 0} title="Cofnij (Ctrl+Z)">
                    <i className="fa fa-undo" />
                </Button>
                <Button variant="dark" size="sm" onClick={redo} disabled={historyIdx >= historyLength - 1} title={t("photoEditor.redo", "Redo (Ctrl+Y)")}>
                    <i className="fa fa-repeat" />
                </Button>
                <Button variant="dark" size="sm" onClick={handleReset} title="Reset">
                    <i className="fa fa-refresh" />
                </Button>
                <div className={cs.toolbarDivider} />
                <Button
                    variant={showCompare ? "outline-info" : "dark"}
                    size="sm"
                    onClick={() => setShowCompare(!showCompare)}
                    title={t("photoEditor.compareOriginal", "Compare with original")}
                >
                    <i className="fa fa-columns" />
                </Button>
                <div className={cs.toolbarDivider} />
                <Button variant="dark" size="sm" onClick={handleDownload} title="Download">
                    <i className="fa fa-download" />
                </Button>
                <Button variant="dark" size="sm" onClick={handleCopyToClipboard} title="Copy to clipboard">
                    <i className="fa fa-clipboard" />
                </Button>
                <Button variant="dark" size="sm" onClick={handleShareNative} title={t("common.share", "Share")}>
                    <i className="fa fa-share-alt" />
                </Button>
            </div>

            <div className={cs.toolbarTitle} style={{ color: accent }}>
                <i className="fa fa-magic me-2" />
                {t("photoEditor.title", "Photo Editor")}
            </div>

            <div className={cs.toolbarGroup}>
                <Button variant="outline-secondary" size="sm" onClick={onCancel}>
                    <i className="fa fa-times me-1" /> {t("common.cancel", "Cancel")}
                </Button>
                <Button
                    size="sm"
                    style={{ background: accent, borderColor: accent, color: "#fff", fontWeight: 600 }}
                    onClick={handleSave}
                >
                    <i className="fa fa-check me-1" /> {t("photoEditor.apply", "Apply")}
                </Button>
            </div>
        </div>
    );
});

PhotoEditorToolbar.displayName = "PhotoEditorToolbar";
export default PhotoEditorToolbar;