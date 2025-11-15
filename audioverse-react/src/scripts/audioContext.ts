let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log("AudioContext initialized!");
        } catch (e) {
            console.error("Error initializing AudioContext:", e);
        }
    }
    return audioCtx!;
}

export function resumeAudioContext() {
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().then(() => console.log("AudioContext resumed!"));
    }
}
