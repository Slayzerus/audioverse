export function drawRadial(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    bins: Uint8Array,
    hueShift: number
) {
    const N = 96;
    const step = Math.max(1, Math.floor(bins.length / N));
    const cx = w / 2, cy = h / 2;
    const R0 = Math.min(w, h) * 0.22;
    const Rmax = Math.min(w, h) * 0.48;

    for (let i = 0; i < N; i++) {
        const v = bins[i * step] / 255;
        const a = (i / N) * Math.PI * 2;
        const r1 = R0;
        const r2 = R0 + v * (Rmax - R0);
        const x1 = cx + Math.cos(a) * r1;
        const y1 = cy + Math.sin(a) * r1;
        const x2 = cx + Math.cos(a) * r2;
        const y2 = cy + Math.sin(a) * r2;

        g.strokeStyle = `hsl(${(i / N) * 360 + hueShift},85%,60%)`;
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }

    g.fillStyle = "rgba(255,255,255,0.08)";
    g.beginPath(); g.arc(cx, cy, R0 * 0.85, 0, Math.PI * 2); g.fill();
}
