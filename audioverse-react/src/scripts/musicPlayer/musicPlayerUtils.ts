export type SourceKind = "youtube" | "hls" | "audio";

export const isYouTubeUrl = (u: string) => /youtu(\.be|be\.com)/i.test(u);
export const isM3U8 = (u?: string) => !!u && /\.m3u8(\?.*)?$/i.test(u);
export const isAudioFile = (u?: string) => !!u && /\.(mp3|aac|m4a|flac|wav|ogg)(\?.*)?$/i.test(u);

export const formatTime = (sec: number) => {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

export function extractVideoId(url?: string) {
    if (!url) return;
    const m1 = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
    if (m1) return m1[1];
    const m2 = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    if (m2) return m2[1];
}