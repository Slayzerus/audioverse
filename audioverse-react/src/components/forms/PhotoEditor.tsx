/* PhotoEditor.tsx — Full-featured, client-side photo editor.
 *
 * Refactored: logic lives in usePhotoEditor hook,
 * UI is split into Toolbar / LeftPanel / Canvas sub-components.
 */

import type { PhotoEditorProps } from "./photoEditorTypes";
import { usePhotoEditor } from "./usePhotoEditor";
import PhotoEditorToolbar from "./PhotoEditorToolbar";
import PhotoEditorLeftPanel from "./PhotoEditorLeftPanel";
import PhotoEditorCanvas from "./PhotoEditorCanvas";
import cs from "./PhotoEditor.module.css";

// ── Component ──

export default function PhotoEditor(props: PhotoEditorProps) {
    const api = usePhotoEditor(props);

    if (api.loading || !api.image) {
        return (
            <div className={cs.loadingWrap}>
                <i className="fa fa-spinner fa-spin fa-2x" />
            </div>
        );
    }

    return (
        <div className={cs.wrapper}>
            <PhotoEditorToolbar api={api} />
            <div className={cs.mainContent}>
                <PhotoEditorLeftPanel api={api} />
                <PhotoEditorCanvas api={api} />
            </div>
        </div>
    );
}
