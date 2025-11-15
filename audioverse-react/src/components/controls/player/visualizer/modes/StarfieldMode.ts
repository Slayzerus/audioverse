export type Star = { x: number; y: number; z: number; pz: number; };

export type StarfieldState = { stars: Star[]; ready: boolean };

export function ensureStarfield(
    stateRef: React.MutableRefObject<StarfieldState | null>,
    count: number, w: number, h: number
) {
    if (!stateRef.current) stateRef.current = { stars: [], ready: false };
    const st = stateRef.current;
    if (!st.ready || st.stars.length !== count) {
        const stars: Star[] = [];
        for (let i = 0; i < count; i++) {
            const s: Star = {
                x: (Math.random() - 0.5) * w,
                y: (Math.random() - 0.5) * h,
                z: Math.random() * 800 + 100,
                pz: 0,
            };
            stars.push(s);
        }
        st.stars = stars;
        st.ready = true;
    }
}

export function drawStarfield(
    g: CanvasRenderingContext2D, w: number, h: number,
    energy: number, hue: number,
    stateRef: React.MutableRefObject<StarfieldState | null>
) {
    const st = stateRef.current!;
    const cx = w / 2, cy = h / 2;
    const speed = 4 + energy * 18;

    g.save();
    g.translate(cx, cy);
    for (const s of st.stars) {
        s.z -= speed;
        if (s.z < 20) {
            s.x = (Math.random() - 0.5) * w;
            s.y = (Math.random() - 0.5) * h;
            s.z = 900;
            s.pz = s.z;
        }

        const sx = (s.x / s.z) * 600;
        const sy = (s.y / s.z) * 600;
        const px = (s.x / s.pz) * 600;
        const py = (s.y / s.pz) * 600;
        s.pz = s.z;

        g.strokeStyle = `hsla(${(hue + 200) % 360}, 90%, 70%, 0.7)`;
        g.lineWidth = Math.max(1, (1 - s.z / 900) * 2);
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(sx, sy);
        g.stroke();
    }
    g.restore();
}
