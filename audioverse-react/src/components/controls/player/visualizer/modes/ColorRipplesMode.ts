export type Ripple = { x: number; y: number; r: number; life: number; hue: number; };

export type RipplesState = { items: Ripple[] };

export function drawColorRipples(
    g: CanvasRenderingContext2D,
    w: number, h: number,
    energy: number, baseHue: number,
    stateRef: React.MutableRefObject<RipplesState | null>
) {
    if (!stateRef.current) stateRef.current = { items: [] };
    const st = stateRef.current;

    // spawn zależny od energii
    if (Math.random() < 0.06 + energy * 0.25) {
        st.items.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 8 + Math.random() * 24,
            life: 1,
            hue: (baseHue + Math.random() * 120) % 360,
        });
    }

    // update & draw
    const next: Ripple[] = [];
    for (const rp of st.items) {
        rp.r += 2 + energy * 14;
        rp.life *= 0.975 - energy * 0.02;

        if (rp.life > 0.04) next.push(rp);

        const grad = g.createRadialGradient(rp.x, rp.y, 1, rp.x, rp.y, rp.r);
        grad.addColorStop(0, `hsla(${rp.hue}, 90%, 60%, ${0.35 * rp.life})`);
        grad.addColorStop(0.6, `hsla(${(rp.hue + 40) % 360}, 80%, 55%, ${0.18 * rp.life})`);
        grad.addColorStop(1, `hsla(${(rp.hue + 80) % 360}, 70%, 50%, 0)`);
        g.fillStyle = grad;
        g.beginPath();
        g.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        g.fill();
    }
    st.items = next;
}
