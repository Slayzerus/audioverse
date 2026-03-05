import React, { useState, useRef } from "react";
import { AudioRecorder } from "../../../../scripts/recording.ts";
import Waveform from "../../editor/Waveform.tsx";
import AudioInputSelect from "../settings/AudioInputSelect.tsx";
import "bootstrap/dist/css/bootstrap.min.css";

export interface AudioRecorderProps {
    onAudioRecorded: (audioBlob: Blob) => void;
}

const AudioRecorderComponent: React.FC<AudioRecorderProps> = ({ onAudioRecorded }) => {
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [recording, setRecording] = useState<boolean>(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = async () => {
        if (!selectedDevice) return;
        recorderRef.current = new AudioRecorder();
        await recorderRef.current.startRecording();
        setRecording(true);
    };

    const stopRecording = async () => {
        if (!recorderRef.current) return;
        const audioBlob = await recorderRef.current.stopRecording();
        setRecording(false);
        if (audioBlob) {
            setAudioBlob(audioBlob);
            onAudioRecorded(audioBlob); // 🔥 Przekazanie nagrania na zewnątrz!
        }
    };

    const togglePlayback = () => {
        if (!audioBlob) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(URL.createObjectURL(audioBlob));
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }

        setIsPlaying(!isPlaying);
    };

    return (
        <div className="container mt-2">
            <div className="card p-2 shadow-sm">
                <h6 className="text-center mb-2">🎤 Audio Recorder</h6>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    {/* Audio input selection component */}
                    <AudioInputSelect
                        selectedDevice={selectedDevice}
                        onDeviceChange={setSelectedDevice}
                        disabled={recording}
                    />

                    <button className="btn btn-sm btn-danger" onClick={startRecording} disabled={recording}>
                        🎤 Start
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={stopRecording} disabled={!recording}>
                        ⏹ Stop
                    </button>

                    {audioBlob && (
                        <button className="btn btn-sm btn-primary" onClick={togglePlayback}>
                            {isPlaying ? "⏸ Pause" : "▶️ Play"
                            }
                        </button>
                    )}
                </div>

                {audioBlob && (
                    <div className="mt-2">
                        <Waveform audioBlob={audioBlob} currentTime={0} duration={10} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioRecorderComponent;
