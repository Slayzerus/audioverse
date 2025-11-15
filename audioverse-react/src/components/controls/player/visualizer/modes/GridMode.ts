export function drawGrid(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    bins: Uint8Array,
    baseHue: number
) {
    const cols = 14, rows = 8;
    const cw = w / cols, ch = h / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = Math.min(bins.length - 1, r * cols + c);
            const v = bins[idx] / 255;
            const hue = (baseHue + (c / cols) * 210 + (r / rows) * 90) % 360;
            const sat = 65 + v * 30;
            const lum = 20 + v * 40;
            const pad = (1 - v) * 4; // im głośniej, tym „ciaśniej”

            g.fillStyle = `hsl(${hue}, ${sat}%, ${lum}%)`;
            g.fillRect(c * cw + pad, r * ch + pad, Math.max(1, cw - 2 * pad), Math.max(1, ch - 2 * pad));
        }
    }
}
