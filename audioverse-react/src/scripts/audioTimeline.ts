export function drawTimeline(canvas: HTMLCanvasElement, zoom: number, duration: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 30 * zoom * duration;
    const height = 30 * zoom;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Rysowanie linii pomocniczych (co 1s)
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    for (let i = 0; i <= duration; i++) {
        const x = (i / duration) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
/*
    // Oznaczenie osi czasu
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();*/
}

// Rysowanie kursora czasu (animacja)
export function drawCursor(
    canvas: HTMLCanvasElement,
    zoom: number,
    duration: number,
    currentTime: number,
    isRecording: boolean
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 30 * zoom * duration;
    const height = 30 * zoom;
    const x = (currentTime / duration) * width;

    drawTimeline(canvas, zoom, duration);

    ctx.strokeStyle = isRecording ? "red" : "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
}
