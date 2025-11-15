export function drawEqualizerCircle(
    g: CanvasRenderingContext2D, w: number, h: number,
    bins: Uint8Array, baseHue: number
) {
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.28;
    const bars = 96;
    const step = Math.max(1, Math.floor(bins.length / bars));

    for (let i = 0; i < bars; i++) {
        const v = (bins[i * step] ?? 0) / 255;
        const a = (i / bars) * Math.PI * 2;
        const len = v * (Math.min(w, h) * 0.22) + 6;

        const x1 = cx + Math.cos(a) * R;
        const y1 = cy + Math.sin(a) * R;
        const x2 = cx + Math.cos(a) * (R + len);
        const y2 = cy + Math.sin(a) * (R + len);

        g.strokeStyle = `hsl(${(baseHue + i * 3) % 360}, 90%, ${40 + v * 40}%)`;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.stroke();
    }

    g.fillStyle = `hsla(${(baseHue + 180) % 360}, 60%, 15%, .4)`;
    g.beginPath();
    g.arc(cx, cy, R - 8, 0, Math.PI * 2);
    g.fill();
}
