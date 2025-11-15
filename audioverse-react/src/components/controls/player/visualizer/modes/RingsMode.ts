export function drawRings(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    bins: Uint8Array,
    energy: number,
    hueShift: number
) {
    const cx = w / 2, cy = h / 2;
    const rings = 5;
    const base = Math.min(w, h) * 0.12;

    for (let r = 0; r < rings; r++) {
        const i = Math.floor((r / rings) * bins.length);
        const v = bins[i] / 255;
        const radius = base + r * base * 0.55 + v * base * 0.5;
        const hue = (hueShift + r * 40) % 360;

        g.lineWidth = 3 + v * 6;
        g.strokeStyle = `hsla(${hue},80%,60%,${0.5 + 0.5 * energy})`;
        g.beginPath(); g.arc(cx, cy, radius, 0, Math.PI * 2); g.stroke();
    }
}
