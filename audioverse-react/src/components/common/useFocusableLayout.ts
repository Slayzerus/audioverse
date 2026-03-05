import { useEffect, useRef } from "react";

export function useFocusableLayout<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [layout, setLayout] = [useRef({ x: 0, y: 0, width: 0, height: 0 }).current, (val: { x: number; y: number; width: number; height: number }) => Object.assign(layout, val)];

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setLayout({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      }
    };
    update();
    // Re-measure after a frame to catch post-render layout shifts (e.g. dropdown animations)
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", update); };
  }, []);

  return { ref, layout };
}
