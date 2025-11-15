// src/components/controls/player/visualizer/modes/RiftMode.ts
// „Szczelina” – dwie przeciwległe fale z przerwą pośrodku.
// Reaguje na czasówkę (time domain) + energię.

export function drawRift(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    timeDomain: Uint8Array,
    energy: number,          // 0..1
    t: number                // sekundy
) {
    // tło
    g.fillStyle = "rgba(10,16,28,0.35)";
    g.fillRect(0, 0, w, h);

    const center = h / 2;
    const gap = Math.max(8, 18 - energy * 10); // szerokość „szczeliny”
    const amp = (h * 0.35) * (0.6 + energy * 0.7); // amplituda boków
    const N = timeDomain.length;
    const stepX = w / (N - 1);

    // GÓRNA połówka (faza lekko przesunięta)
    g.beginPath();
    for (let i = 0; i < N; i++) {
        const v = (timeDomain[i] - 128) / 128; // -1..1
        const phase = Math.sin(t * 1.5 + i * 0.03) * 0.12;
        const x = i * stepX;
        const y = center - gap - (v + phase) * amp;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    const gradTop = g.createLinearGradient(0, 0, 0, center - gap);
    gradTop.addColorStop(0, "hsla(260,90%,75%,0.9)");
    gradTop.addColorStop(1, "hsla(220,85%,60%,0.4)");
    g.strokeStyle = gradTop;
    g.lineWidth = 2;
    g.stroke();

    // DOLNA połówka (lustrzana + inne przesunięcie fazy)
    g.beginPath();
    for (let i = 0; i < N; i++) {
        const v = (timeDomain[i] - 128) / 128;
        const phase = Math.cos(t * 1.3 + i * 0.035) * 0.12;
        const x = i * stepX;
        const y = center + gap + (v + phase) * amp;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    const gradBottom = g.createLinearGradient(0, center + gap, 0, h);
    gradBottom.addColorStop(0, "hsla(190,90%,65%,0.9)");
    gradBottom.addColorStop(1, "hsla(160,85%,55%,0.4)");
    g.strokeStyle = gradBottom;
    g.lineWidth = 2;
    g.stroke();

    // subtelna poświata wzdłuż krawędzi „riftu”
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = "rgba(255,255,255,0.08)";
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, center - gap); g.lineTo(w, center - gap); g.stroke();
    g.beginPath(); g.moveTo(0, center + gap); g.lineTo(w, center + gap); g.stroke();
    g.globalCompositeOperation = "source-over";
}
