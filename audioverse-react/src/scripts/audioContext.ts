import { logger } from '../utils/logger';
const log = logger.scoped('audioContext');

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            log.error("Error initializing AudioContext:", e);
        }
    }
    return audioCtx!;
}

/**
 * Resume the global AudioContext if it's suspended.
 * Safe to call from user gestures (click, keydown, gamepad…).
 * Returns a promise that resolves once the context is running.
 */
export async function resumeAudioContext(): Promise<void> {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
        await ctx.resume();
    }
}

/**
 * Returns true when the global AudioContext is in the "running" state.
 */
export function isAudioContextRunning(): boolean {
    return !!audioCtx && audioCtx.state === "running";
}
