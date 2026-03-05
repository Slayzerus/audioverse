/* VideoEditor.tsx — Full-featured client-side video editor.
 *
 * Refactored: logic extracted to useVideoEditor hook,
 * UI split into VideoEditorToolbar, VideoEditorLeftPanel, VideoEditorTimeline.
 *
 * Usage:
 *   <VideoEditor
 *     src={fileOrUrl}
 *     playerColor="#ff4444"
 *     onSave={(file, stateJson?) => { ... }}
 *     onCancel={() => { ... }}
 *   />
 */

import { useVideoEditor } from "./useVideoEditor";
import VideoEditorToolbar from "./VideoEditorToolbar";
import VideoEditorLeftPanel from "./VideoEditorLeftPanel";
import VideoEditorTimeline from "./VideoEditorTimeline";
import s from "./VideoEditor.module.css";

// ── Types ──

interface VideoEditorProps {
    src: File | Blob | string;
    playerColor?: string;
    onSave: (file: File, editorStateJson?: string) => void;
    onCancel: () => void;
    initialState?: string | null;
}

// ── Component ──

export default function VideoEditor({ src, playerColor = "#00aaff", onSave, onCancel, initialState }: VideoEditorProps) {
    const api = useVideoEditor({ src, playerColor, onSave, onCancel, initialState });
    const { videoRef, canvasRef, containerRef, loading, volume } = api;

    // ── Loading ──
    if (loading) {
        return (
            <div className={s.loadingWrap}>
                <i className="fa fa-spinner fa-spin fa-2x" />
            </div>
        );
    }

    // ── Render ──
    return (
        <div className={s.wrapper}>
            {/* Hidden video element */}
            <video ref={videoRef} className={s.hiddenVideo} muted={volume === 0} playsInline crossOrigin="anonymous" />

            {/* Top toolbar */}
            <VideoEditorToolbar api={api} />

            {/* Main area: sidebar + canvas */}
            <div className={s.mainArea}>
                {/* Left panel */}
                <VideoEditorLeftPanel api={api} />

                {/* Canvas viewport */}
                <div ref={containerRef} className={s.canvasViewport}>
                    {/* Video canvas */}
                    <div className={s.canvasCenter}>
                        <canvas
                            ref={canvasRef}
                            className={s.canvas}
                            role="img"
                            aria-label="Video editor preview canvas"
                        />
                    </div>

                    {/* Timeline / playback controls */}
                    <VideoEditorTimeline api={api} />
                </div>
            </div>
        </div>
    );
}

