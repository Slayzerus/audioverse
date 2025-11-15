export type Particle = {
    x: number; y: number;
    vx: number; vy: number;
    life: number; max: number;
    hue: number;
};

export function drawParticles(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    energy: number,
    hueShift: number,
    particles: { current: Particle[] }
) {
    const cx = w / 2, cy = h / 2;

    // spawn rate zależny od energii
    const spawn = 2 + Math.floor(energy * 14);
    for (let s = 0; s < spawn; s++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.5 + Math.random() * (2.5 + energy * 4);
        particles.current.push({
            x: cx, y: cy,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0, max: 40 + Math.random() * 60,
            hue: (hueShift + Math.random() * 60) % 360
        });
    }

    // trail
    g.fillStyle = "rgba(2,6,23,0.2)";
    g.fillRect(0, 0, w, h);

    const p = particles.current;
    for (let i = p.length - 1; i >= 0; i--) {
        const it = p[i];
        it.x += it.vx; it.y += it.vy; it.life += 1;
        const alpha = 1 - it.life / it.max;
        g.fillStyle = `hsla(${it.hue},85%,60%,${Math.max(0, alpha)})`;
        g.beginPath(); g.arc(it.x, it.y, 2 + alpha * 3, 0, Math.PI * 2); g.fill();
        if (it.life >= it.max || it.x < -20 || it.y < -20 || it.x > w+20 || it.y > h+20) p.splice(i, 1);
    }
    if (p.length > 1200) p.splice(0, p.length - 1200);
}
