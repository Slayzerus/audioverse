export function drawWaveform(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: Uint8Array
) {
    g.lineWidth = 2;
    g.strokeStyle = "#c7d2fe";
    g.beginPath();
    const slice = w / time.length;
    for (let i = 0; i < time.length; i++) {
        const v = (time[i] - 128) / 128;
        const x = i * slice;
        const y = h / 2 + v * (h * 0.45);
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
}
