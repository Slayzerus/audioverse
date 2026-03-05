export type Ember = { x:number; y:number; r:number; vx:number; vy:number; life:number };
export type FireplaceState = { embers: Ember[]; t:number };

function rand(min:number, max:number){ return min + Math.random()*(max-min); }

export function drawCozyFireplace(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    bins: Uint8Array,
    energy: number,
    baseHue: number,
    stateRef: React.MutableRefObject<FireplaceState | null>
){
    if (!stateRef.current) stateRef.current = { embers: [], t: 0 };
    const st = stateRef.current;

    // tło żaru
    const glow = g.createLinearGradient(0, h, 0, h*0.4);
    glow.addColorStop(0, `hsla(${(baseHue+30)%360}, 90%, 50%, .35)`);
    glow.addColorStop(1, `hsla(${(baseHue+10)%360}, 90%, 50%, 0)`);
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);

    // „języki” ognia w kilku kolumnach
    const cols = 6;
    for (let i=0;i<cols;i++){
        const x0 = ((i+0.5)/cols) * w;
        const amp = (bins[Math.floor((i+1)/ (cols+1) * bins.length)] || 0)/255;
        const height = h*0.18 + (0.25 + energy*0.6 + amp*0.7) * h*0.55;

        const grad = g.createLinearGradient(x0, h, x0, h-height);
        grad.addColorStop(0, `hsla(${(baseHue+40)%360},100%,55%,.9)`);
        grad.addColorStop(0.5, `hsla(${(baseHue+10)%360},100%,60%,.75)`);
        grad.addColorStop(1, `hsla(${(baseHue-20)%360},100%,80%,.05)`);

        const sway = Math.sin(st.t*1.2 + i*0.8) * (15 + energy*30);

        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(x0 - 20, h);
        g.bezierCurveTo(x0 - 35, h - height*0.45, x0 - 25 + sway, h - height*0.75, x0 + sway, h - height);
        g.bezierCurveTo(x0 + 25 + sway*0.3, h - height*0.65, x0 + 35, h - height*0.35, x0 + 20, h);
        g.closePath();
        g.fill();
    }

    // żary / iskry
    const spawn = Math.floor(1 + energy*6);
    for (let s=0;s<spawn;s++){
        st.embers.push({
            x: rand(w*0.25, w*0.75),
            y: h - rand(4,14),
            r: rand(1,3),
            vx: rand(-0.15,0.15),
            vy: -rand(0.6,1.8) - energy*1.2,
            life: rand(0.8, 1.6)
        });
    }

    g.save();
    g.globalCompositeOperation = "lighter";
    for (let i=st.embers.length-1;i>=0;i--){
        const e = st.embers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.vy -= 0.01;            // slightly upward
        e.life -= 0.015 + energy*0.02;
        if (e.life <= 0 || e.y < -10) { st.embers.splice(i,1); continue; }

        const c = g.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r*3);
        c.addColorStop(0, `hsla(${(baseHue+25)%360},100%,65%,.9)`);
        c.addColorStop(1, `hsla(${(baseHue+25)%360},100%,65%,0)`);
        g.fillStyle = c;
        g.beginPath();
        g.arc(e.x,e.y,e.r*3,0,Math.PI*2);
        g.fill();
    }
    g.restore();

    // „polana”
    g.fillStyle = "rgba(60,36,22,.9)";
    g.fillRect(w*0.2, h-10, w*0.6, 6);

    st.t += 0.02 + energy*0.08;
}
