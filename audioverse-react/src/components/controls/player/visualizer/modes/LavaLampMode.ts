export type LavaBlob = { x:number; y:number; r:number; vx:number; vy:number; hue:number };
export type LavaBlobState = { blobs: LavaBlob[] };

function rand(min:number, max:number) { return min + Math.random()*(max-min); }

export function drawLavaLamp(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    energy: number,
    baseHue: number,
    stateRef: React.MutableRefObject<LavaBlobState | null>
) {
    if (!stateRef.current) {
        const n = 7;
        stateRef.current = {
            blobs: Array.from({length:n}, (_,i) => ({
                x: rand(w*0.2, w*0.8),
                y: rand(h*0.2, h*0.8),
                r: rand(Math.min(w,h)*0.05, Math.min(w,h)*0.12),
                vx: rand(-0.6, 0.6),
                vy: rand(-0.6, 0.6),
                hue: (baseHue + i*10) % 360
            }))
        };
    }

    const st = stateRef.current!;
    const speed = 0.6 + energy * 2.2;

    g.save();
    g.globalCompositeOperation = "lighter";

    for (const b of st.blobs) {
        b.x += b.vx * speed;
        b.y += b.vy * speed;

        // miękkie „unoszenie się”
        b.vy -= 0.01 - energy*0.015;

        // odbicia
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }
        if (b.y > h - b.r) { b.y = h - b.r; b.vy = -Math.abs(b.vy); }

        const hue = (b.hue + energy*120) % 360;
        const grad = g.createRadialGradient(b.x, b.y, b.r*0.2, b.x, b.y, b.r);
        grad.addColorStop(0, `hsla(${hue}, 95%, 70%, .8)`);
        grad.addColorStop(1, `hsla(${(hue+40)%360}, 90%, 30%, 0)`);

        g.fillStyle = grad;
        g.shadowBlur = 18;
        g.shadowColor = `hsl(${hue}, 100%, 60%)`;
        g.beginPath();
        g.arc(b.x, b.y, b.r, 0, Math.PI*2);
        g.fill();
    }

    g.restore();

    // delikatny film „szkła”
    g.strokeStyle = "rgba(255,255,255,.06)";
    g.lineWidth = 2;
    g.strokeRect(1,1,w-2,h-2);
}
