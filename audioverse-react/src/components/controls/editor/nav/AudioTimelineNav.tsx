import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../AudioEditor.css";

interface AudioTimelineNavProps {
    isPlaying: boolean;
    isLooping: boolean;
    currentTime: number;
    duration: number;
    onPlayPause: () => void;
    onRecord: () => void;
    onLoop: () => void;
    onAdjustDuration: (amount: number) => void;
}

const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
};

const AudioTimelineNav: React.FC<AudioTimelineNavProps> = ({
                                                                          isPlaying,
                                                                          /*isRecording,*/
                                                                          isLooping,
                                                                          currentTime,
                                                                          duration,
                                                                          onPlayPause,
                                                                          onRecord,
                                                                          onLoop,
                                                                          /*onAdjustTime,*/
                                                                            onAdjustDuration
                                                                      }) => {
    return (
        <div className="timeline-nav">
            <div className="fw-bold" style={{
                fontSize: "14px",
                backgroundColor: "black",
                color: "white",
                padding: "0 5px",
                fontFamily: "monospace"
            }}>
                <div style={{height: "12px"}}>{formatTime(currentTime)}</div>
                <div>{formatTime(duration)}</div>
            </div>
            <button onClick={onRecord} className={`btn btn-secondary timeline-nav-button`}>
                <i className="fa-solid fa-circle"></i>
            </button>
            <button onClick={onPlayPause} className={`btn btn-secondary timeline-nav-button`}>
                {isPlaying ? <i className="fa-solid fa-square"></i> : <i className="fa-solid fa-play"></i>}
            </button>
            <button onClick={onLoop}
                    className={`btn ${isLooping ? "btn-primary" : "btn-secondary"} timeline-nav-button`}>
                <i className="fa-solid fa-infinity"></i>
            </button>
            <button className="btn btn-secondary timeline-nav-button" onClick={() => onAdjustDuration(-1)}>
                <i className="fa-solid fa-minus" style={{marginRight: "2px"}}></i>
                <i className="fa-regular fa-clock"></i>
            </button>
            <button className="btn btn-secondary timeline-nav-button" onClick={() => onAdjustDuration(1)}>
                <i className="fa-solid fa-plus" style={{marginRight: "2px"}}></i>
                <i className="fa-regular fa-clock"></i>
            </button>
            <button className="btn btn-secondary timeline-nav-button">
                <i className="fa-solid fa-arrow-pointer"></i>
            </button>
            <button className="btn btn-secondary timeline-nav-button">
                <i className="fa-regular fa-hand"></i>
            </button>
            <button className="btn btn-secondary timeline-nav-button">
                <i className="fa-solid fa-arrows-left-right"></i>
            </button>
            <button className="btn btn-secondary timeline-nav-button">
                <i className="fa-regular fa-clipboard"></i>
            </button>


        </div>
    );
};

export default AudioTimelineNav;
