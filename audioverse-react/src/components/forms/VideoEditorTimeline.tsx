/**
 * VideoEditorTimeline — bottom timeline with trim handles, playhead,
 * text overlay markers, and playback controls.
 */

import React from "react";
import { Button } from "react-bootstrap";
import { formatTime } from "../../scripts/videoEffects";
import type { VideoEditorAPI } from "./useVideoEditor";
import s from "./VideoEditor.module.css";

interface Props {
    api: VideoEditorAPI;
}

const VideoEditorTimeline: React.FC<Props> = ({ api }) => {
    const {
        accent, timelineRef,
        duration, currentTime, isPlaying,
        trimStart, effectiveTrimEnd,
        textOverlays, selectedTextId,
        togglePlay, skipForward, skipBack,
        handleTimelineMouseDown, speed,
    } = api;

    return (
        <div className={s.timelineContainer}>
            {/* Progress bar with trim handles */}
            <div
                ref={timelineRef}
                className={s.progressBar}
                onMouseDown={(e) => handleTimelineMouseDown(e, "seek")}
            >
                {/* Trimmed area */}
                <div className={s.trimArea} style={{
                    left: `${(trimStart / duration) * 100}%`,
                    width: `${((effectiveTrimEnd - trimStart) / duration) * 100}%`,
                    background: `${accent}33`,
                }} />

                {/* Playhead */}
                <div className={s.playhead} style={{
                    left: `${(currentTime / duration) * 100}%`,
                    background: accent,
                }}>
                    <div className={s.playheadDot} style={{ background: accent }} />
                </div>

                {/* Trim start handle */}
                <div
                    className={s.trimHandleStart}
                    style={{ left: `${(trimStart / duration) * 100}%` }}
                    onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, "start"); }}
                />

                {/* Trim end handle */}
                <div
                    className={s.trimHandleEnd}
                    style={{ left: `${(effectiveTrimEnd / duration) * 100}%` }}
                    onMouseDown={(e) => { e.stopPropagation(); handleTimelineMouseDown(e, "end"); }}
                />

                {/* Text overlay markers */}
                {textOverlays.map((ov) => (
                    <div key={ov.id} className={s.textMarker} style={{
                        left: `${(ov.startTime / duration) * 100}%`,
                        width: `${((ov.endTime - ov.startTime) / duration) * 100}%`,
                        background: selectedTextId === ov.id ? "#4fc3f7" : "#4fc3f788",
                    }} />
                ))}
            </div>

            {/* Playback buttons + time */}
            <div className={s.playbackControls}>
                <span className={s.timeDisplayRight}>
                    {formatTime(currentTime)}
                </span>

                <Button variant="dark" size="sm" onClick={skipBack} title="-5s" className={s.skipBtn}>
                    <i className="fa fa-backward" />
                </Button>
                <Button
                    size="sm"
                    className={s.playBtn}
                    style={{ background: accent, borderColor: accent }}
                    onClick={togglePlay}
                >
                    <i className={`fa ${isPlaying ? "fa-pause" : "fa-play"}`} style={{ marginLeft: isPlaying ? 0 : 2 }} />
                </Button>
                <Button variant="dark" size="sm" onClick={skipForward} title="+5s" className={s.skipBtn}>
                    <i className="fa fa-forward" />
                </Button>

                <span className={s.timeDisplay}>
                    {formatTime(effectiveTrimEnd)}
                </span>

                <div className={s.timelineDivider} />

                <span className={s.speedLabel}>
                    {speed !== 1 && <span style={{ color: accent }}>{speed.toFixed(2)}×</span>}
                </span>
            </div>
        </div>
    );
};

export default React.memo(VideoEditorTimeline);
