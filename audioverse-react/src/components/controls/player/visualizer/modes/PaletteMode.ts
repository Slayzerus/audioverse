export function drawPalette(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    bins: Uint8Array,
    baseHue: number
) {
    const cols = 12;
    const rows = 6;
    const tileW = w / cols;
    const tileH = h / rows;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) % bins.length;
            const v = bins[idx] / 255;
            const hue = (baseHue + (c / cols) * 180 + (r / rows) * 90) % 360;
            const sat = 70 + v * 25;
            const lum = 25 + v * 35;
            g.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
            g.fillRect(c * tileW, r * tileH, Math.ceil(tileW), Math.ceil(tileH));
        }
    }
}
