// src/components/controls/player/visualizer/modes/PlasmaBallMode.ts
export function drawPlasmaBall(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    energy: number,     // 0..1
    baseHue: number     // 0..360
) {
    // tło lekkie
    g.fillStyle = "rgba(10,16,28,0.25)";
    g.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * (0.38 + energy * 0.12);

    // kula – gradient
    const grad = g.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
    grad.addColorStop(0, `hsla(${(baseHue + 200) % 360},90%,70%,0.95)`);
    grad.addColorStop(0.5, `hsla(${(baseHue + 260) % 360},80%,55%,0.6)`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, radius, 0, Math.PI * 2);
    g.fill();

    // wyładowania („promienie”) – liczba rośnie z energią
    const rays = 18 + Math.floor(energy * 50);
    for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2 + t * (0.6 + energy * 1.4);
        const jitter = (Math.sin(t * 2 + i * 1.7) + Math.cos(t * 1.3 + i * 2.1)) * 0.15;
        const len = radius * (0.4 + 0.55 * Math.abs(Math.sin(t * 1.2 + i)));
        const kinks = 6;

        g.save();
        g.translate(cx, cy);
        g.rotate(ang + jitter);
        g.beginPath();
        g.moveTo(0, 0);

        for (let s = 1; s <= kinks; s++) {
            const r = (len / kinks) * s;
            const offset =
                (Math.sin(t * 3 + i * 0.8 + s) * 0.6 + Math.cos(t * 2 + i + s * 0.7)) *
                (8 + 24 * energy);
            const yy = r;
            const xx = offset;
            g.lineTo(xx, yy);
        }

        g.globalCompositeOperation = "lighter";
        const hue = (baseHue + i * (240 / rays)) % 360;
        g.strokeStyle = `hsla(${hue}, 90%, ${60 + energy * 20}%, ${0.35 + energy * 0.4})`;
        g.lineWidth = 2 + energy * 2;
        g.stroke();
        g.restore();
    }

    // corona
    g.beginPath();
    g.arc(cx, cy, radius * (0.98 + 0.02 * Math.sin(t * 2)), 0, Math.PI * 2);
    g.strokeStyle = `hsla(${(baseHue + 40) % 360},90%,70%,${0.25 + energy * 0.25})`;
    g.lineWidth = 1.5;
    g.stroke();

    g.globalCompositeOperation = "source-over";
}
