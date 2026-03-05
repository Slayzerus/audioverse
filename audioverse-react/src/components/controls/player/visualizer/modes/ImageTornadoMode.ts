export type TornadoSprite = {
    img: HTMLImageElement;
    x: number; y: number; z: number;       // pseudo 3D
    ang: number;                            // kąt wiru
    spin: number;                           // prędkość obrotu
    vz: number;
    size: number;
};

export type ImageTornadoState = {
    sprites: TornadoSprite[];
    loadedUrls: string[];
    ready: boolean;
};

function loadImages(urls: string[]): Promise<HTMLImageElement[]> {
    const unique = Array.from(new Set(urls.filter(Boolean)));
    const loaders = unique.map(u => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img); // nie blokuj
        img.src = u!;
    }));
    return Promise.all(loaders);
}

export async function ensureTornadoState(
    stateRef: React.MutableRefObject<ImageTornadoState | null>,
    urls: string[], count: number, w: number, h: number
) {
    if (!stateRef.current) stateRef.current = { sprites: [], loadedUrls: [], ready: false };
    const st = stateRef.current;

    const needReload = urls.join("|") !== st.loadedUrls.join("|");
    if (!st.ready || needReload) {
        const imgs = await loadImages(urls.length ? urls : []);
        st.loadedUrls = urls;
        st.sprites = [];
        st.ready = true;

        const pick = (i: number) => imgs[i % Math.max(1, imgs.length)] ?? new Image();
        for (let i = 0; i < count; i++) {
            const r = Math.random() * Math.min(w, h) * 0.38 + 40;
            st.sprites.push({
                img: pick(i),
                x: (Math.random() - .5) * r * 0.4,
                y: (Math.random() - .5) * r * 0.4,
                z: Math.random() * 600 + 100,
                ang: Math.random() * Math.PI * 2,
                spin: (Math.random() * 0.03 + 0.01) * (Math.random() < .5 ? -1 : 1),
                vz: Math.random() * 1.2 + 0.2,
                size: Math.random() * 0.35 + 0.65,
            });
        }
    }
}

export function drawImageTornado(
    g: CanvasRenderingContext2D,
    w: number, h: number,
    energy: number, baseHue: number,
    stateRef: React.MutableRefObject<ImageTornadoState | null>,
    _urls: string[], _count: number
) {
    const st = stateRef.current;
    if (!st?.ready) return;

    const cx = w / 2, cy = h / 2;
    const depth = 900;
    const speedScale = 1 + energy * 2;

    // ruch
    for (const s of st.sprites) {
        s.ang += s.spin * speedScale;
        s.z -= s.vz * (0.8 + energy * 2.4);
        if (s.z < 40) s.z = depth;

        const radius = Math.min(w, h) * 0.32 + Math.sin(s.ang * 0.8) * 18;
        s.x = Math.cos(s.ang) * radius;
        s.y = Math.sin(s.ang * 1.1) * radius * 0.6;
    }

    // sort wg odległości (Painter's algo)
    const sorted = [...st.sprites].sort((a, b) => b.z - a.z);

    for (const s of sorted) {
        const scale = (depth / (depth - s.z)) * 0.6 * s.size;
        const x = cx + s.x * scale;
        const y = cy + s.y * scale;
        const wImg = 64 * scale;
        const hImg = 64 * scale;

        // neon glow
        g.save();
        g.globalAlpha = 0.12 + (1 - s.z / depth) * 0.2;
        g.fillStyle = `hsl(${(baseHue + (1 - s.z / depth) * 60) % 360}, 90%, 60%)`;
        g.beginPath();
        g.ellipse(x, y, wImg * 0.7, hImg * 0.7, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();

        if (s.img && s.img.width) {
            g.drawImage(s.img, x - wImg / 2, y - hImg / 2, wImg, hImg);
        } else {
            // placeholder (gdy nie ma obrazków)
            g.save();
            g.fillStyle = `hsl(${(baseHue + 180) % 360}, 40%, 55%)`;
            g.fillRect(x - wImg / 2, y - hImg / 2, wImg, hImg);
            g.restore();
        }
    }
}
