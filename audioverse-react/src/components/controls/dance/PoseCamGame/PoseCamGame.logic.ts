import { PoseDetectionResult } from "../../../../models/modelsAiVideo";
import { NormalizedPose, PoseSimilarity, SimplePoseForDraw } from "./PoseCamGame.types";

/// Converts detection to a normalized pose vector: centered and scaled to unit size.
/// Missing confidence defaults to 0.0. Normalization makes the scoring engine-agnostic.
export const normalizePose = (det: PoseDetectionResult | null): NormalizedPose | null => {
    if (!det || !det.persons || det.persons.length === 0) return null;
    const p = det.persons[0];
    if (!p || !p.keypoints || p.keypoints.length === 0) return null;

    const xs = p.keypoints.map(k => k.x);
    const ys = p.keypoints.map(k => k.y);
    const cx = average(xs);
    const cy = average(ys);

    const maxDist = Math.max(
        1e-6,
        Math.sqrt(
            Math.max(...p.keypoints.map(k => (k.x - cx) * (k.x - cx) + (k.y - cy) * (k.y - cy)))
        )
    );

    const out: NormalizedPose = {};
    for (const kp of p.keypoints) {
        out[kp.name || ""] = {
            x: (kp.x - cx) / maxDist,
            y: (kp.y - cy) / maxDist,
            c: kp.confidence ?? 0,
        };
    }
    return out;
};

/// Computes similarity between two normalized poses.
/// Returns score in 0..100 using an exponential falloff controlled by distanceScale.
export const comparePoses = (
    a: NormalizedPose | null,
    b: NormalizedPose | null,
    distanceScale = 0.4
): PoseSimilarity => {
    if (!a || !b) return { score: 0, avgDistance: 1, commonCount: 0, names: [] };

    const names = Object.keys(a).filter(n => n && b[n]);
    if (names.length === 0) return { score: 0, avgDistance: 1, commonCount: 0, names: [] };

    let sum = 0;
    for (const n of names) {
        const da = a[n], db = b[n];
        const dx = da.x - db.x;
        const dy = da.y - db.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        sum += d;
    }
    const avg = sum / names.length;

    // Score mapping: 0 distance => 100; grows softer with distanceScale.
    const score = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-avg / Math.max(1e-6, distanceScale)))));

    return { score, avgDistance: avg, commonCount: names.length, names };
};

/// Draws the first person's keypoints over a video frame (for preview).
export const drawPose = (
    ctx: CanvasRenderingContext2D,
    frame: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    det: PoseDetectionResult | null,
    color = "#00c8ff"
): void => {
    const w = frame instanceof HTMLVideoElement ? frame.videoWidth : frame.width;
    const h = frame instanceof HTMLVideoElement ? frame.videoHeight : frame.height;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.drawImage(frame, 0, 0, w, h);

    if (!det || !det.persons || det.persons.length === 0) return;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (const p of det.persons) {
        for (const kp of p.keypoints ?? []) {
            const r = 3;
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }
};

/// Packs a detection for simple display elsewhere (e.g., saved target).
export const toSimplePose = (det: PoseDetectionResult | null): SimplePoseForDraw | null => {
    if (!det) return null;
    return { w: det.image_width, h: det.image_height, persons: det.persons ?? [] };
};

/// Draws a previously saved pose on an empty canvas (no video frame).
export const drawSavedPose = (ctx: CanvasRenderingContext2D, s: SimplePoseForDraw, color = "#00c8ff"): void => {
    ctx.canvas.width = s.w || 640;
    ctx.canvas.height = s.h || 480;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (const p of s.persons) {
        for (const kp of p.keypoints ?? []) {
            const r = 3;
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }
};

const average = (arr: number[]): number => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
