export function drawSpectrum(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    bins: Uint8Array,
    hueShift: number
) {
    const bars = Math.min(bins.length, 256);
    const step = Math.max(1, Math.floor(bins.length / bars));
    const barW = w / bars;
    for (let i = 0; i < bars; i++) {
        const v = bins[i * step] / 255;
        const bh = v * (h - 6);
        const x = i * barW;
        const y = h - bh;
        const hue = (i / bars) * 240 + hueShift;
        g.fillStyle = `hsl(${hue % 360}, 80%, ${Math.max(30, 40 + v * 30)}%)`;
        g.fillRect(x + 1, y, barW - 2, bh);
    }
}
