import { PoseDetectionResult } from "../../../models/modelsAiVideo";

/// Draws image and dance overlay on a target canvas.
/// The base image is drawn to cover canvas; keypoints are plotted as small circles.
export const drawPoseOnCanvas = async (
    canvas: HTMLCanvasElement,
    imageBlobUrl: string,
    result: PoseDetectionResult
): Promise<void> => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = await loadImage(imageBlobUrl);
    canvas.width = img.naturalWidth || result.image_width || img.width;
    canvas.height = img.naturalHeight || result.image_height || img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ffff";
    ctx.fillStyle = "#00ffff";

    for (const p of result.persons ?? []) {
        for (const kp of p.keypoints ?? []) {
            const r = 3;
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }
};

/// Loads an HTMLImageElement from a blob/object URL.
const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
