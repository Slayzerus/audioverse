type Tri = { a: number; r: number; dr: number };

export type TrianglesState = { tris: Tri[] };

export function drawNeonTriangles(
    g: CanvasRenderingContext2D, w: number, h: number,
    energy: number, baseHue: number,
    stateRef: React.MutableRefObject<TrianglesState | null>
) {
    if (!stateRef.current) stateRef.current = { tris: [] };
    const st = stateRef.current;

    // utrzymuj liczbę figur
    const target = 6;
    while (st.tris.length < target) st.tris.push({
        a: Math.random() * Math.PI * 2,
        r: 30 + Math.random() * Math.min(w, h) * 0.35,
        dr: (Math.random() * 0.6 + 0.2) * (Math.random() < .5 ? -1 : 1),
    });

    const cx = w / 2, cy = h / 2;

    for (const t of st.tris) {
        t.a += 0.002 + energy * 0.02 * (t.dr > 0 ? 1 : -1);
        t.r += Math.sin(t.a * 2) * (0.3 + energy * 1.4);

        const R = Math.max(40, Math.min(t.r, Math.min(w, h) * 0.48));

        g.save();
        g.translate(cx, cy);
        g.rotate(t.a);
        g.strokeStyle = `hsla(${(baseHue + R * 0.2) % 360}, 90%, 60%, .9)`;
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(R, 0);
        for (let i = 1; i < 3; i++) {
            const ang = (i * Math.PI * 2) / 3;
            g.lineTo(Math.cos(ang) * R, Math.sin(ang) * R);
        }
        g.closePath();
        g.shadowBlur = 12;
        g.shadowColor = g.strokeStyle as string;
        g.stroke();
        g.restore();
    }
}
