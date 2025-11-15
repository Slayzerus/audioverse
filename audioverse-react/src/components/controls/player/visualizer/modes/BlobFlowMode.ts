type Node = { ang: number; phase: number; baseR: number };

export type BlobState = { nodes: Node[] };

export function drawBlobFlow(
    g: CanvasRenderingContext2D, w: number, h: number,
    energy: number, baseHue: number,
    stateRef: React.MutableRefObject<BlobState | null>
) {
    if (!stateRef.current) {
        const nodes: Node[] = [];
        const N = 24;
        for (let i = 0; i < N; i++) {
            nodes.push({
                ang: (i / N) * Math.PI * 2,
                phase: Math.random() * Math.PI * 2,
                baseR: Math.min(w, h) * 0.22 + Math.random() * 30,
            });
        }
        stateRef.current = { nodes };
    }
    const st = stateRef.current;

    const cx = w / 2, cy = h / 2;
    const k = 26 + energy * 80;

    const pts: Array<[number, number]> = [];
    for (const n of st.nodes) {
        n.phase += 0.02 + energy * 0.06;
        const r = n.baseR + Math.sin(n.phase) * k;
        const x = cx + Math.cos(n.ang) * r;
        const y = cy + Math.sin(n.ang) * r;
        pts.push([x, y]);
    }

    // rysowanie gładkiego bloba
    g.fillStyle = `hsla(${baseHue}, 70%, 55%, .22)`;
    g.strokeStyle = `hsla(${(baseHue + 40) % 360}, 90%, 65%, .9)`;
    g.lineWidth = 2;

    g.beginPath();
    for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        const cxm = (x1 + x2) / 2;
        const cym = (y1 + y2) / 2;
        if (i === 0) g.moveTo(cxm, cym);
        else g.quadraticCurveTo(x1, y1, cxm, cym);
    }
    g.closePath();
    g.fill();
    g.stroke();
}
