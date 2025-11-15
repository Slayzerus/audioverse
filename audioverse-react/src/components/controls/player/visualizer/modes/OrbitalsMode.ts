export function drawOrbitals(
    g: CanvasRenderingContext2D, w: number, h: number,
    bins: Uint8Array, baseHue: number, angleRef: React.MutableRefObject<number>
) {
    const cx = w / 2, cy = h / 2;
    const N = 5;
    const maxR = Math.min(w, h) * 0.42;

    angleRef.current += 0.01;

    for (let i = 0; i < N; i++) {
        const ratio = (i + 1) / (N + 1);
        const r = ratio * maxR;
        g.strokeStyle = `hsla(${(baseHue + i * 30) % 360}, 70%, 45%, 0.35)`;
        g.lineWidth = 1;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.stroke();

        const idx = Math.floor((bins.length * ratio) | 0);
        const amp = (bins[idx] ?? 0) / 255;
        const count = 6 + i * 2;

        for (let k = 0; k < count; k++) {
            const a = angleRef.current * (1 + i * 0.15) + (k / count) * Math.PI * 2;
            const rr = r + Math.sin(a * 2) * 6 * amp;
            const x = cx + Math.cos(a) * rr;
            const y = cy + Math.sin(a) * rr;
            g.fillStyle = `hsla(${(baseHue + i * 30 + k * 6) % 360}, 90%, ${55 + amp * 30}%, ${0.6 + amp * 0.3})`;
            g.beginPath();
            g.arc(x, y, 2 + amp * 4, 0, Math.PI * 2);
            g.fill();
        }
    }
}
