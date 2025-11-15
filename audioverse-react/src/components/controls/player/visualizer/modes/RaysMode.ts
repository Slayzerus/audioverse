export function drawRays(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    bins: Uint8Array,
    hueShift: number,
    angleRef: { current: number }
) {
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.5;

    const lowAvg = avg(bins, 0, Math.floor(bins.length * 0.1)) / 255;
    const highAvg = avg(bins, Math.floor(bins.length * 0.6), bins.length) / 255;

    angleRef.current += 0.01 + highAvg * 0.03;

    const rays = 24;
    for (let i = 0; i < rays; i++) {
        const a = angleRef.current + (i / rays) * Math.PI * 2;
        const len = (0.35 + lowAvg * 0.55) * R;
        const x = cx + Math.cos(a) * len;
        const y = cy + Math.sin(a) * len;

        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, len);
        const hue = (i / rays) * 360 + hueShift;
        grad.addColorStop(0, `hsla(${hue},85%,65%,0.0)`);
        grad.addColorStop(1, `hsla(${hue},85%,65%,0.9)`);

        g.strokeStyle = grad;
        g.lineWidth = 6 + highAvg * 8;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
    }

    // lekki „dymek”, żeby zostawał ślad
    g.fillStyle = "rgba(2,6,23,0.25)";
    g.fillRect(0, 0, w, h);
}

function avg(arr: Uint8Array, from: number, to: number) {
    let s = 0, n = 0; for (let i = from; i < to; i++) { s += arr[i]; n++; }
    return n ? s / n : 0;
}
