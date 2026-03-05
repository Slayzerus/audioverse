/**
 * FilterThumb.tsx — Filter thumbnail sub-component for PhotoEditor.
 */
import { useRef, useEffect } from "react";
import type { FilterDefinition } from "../../scripts/photoFilters";

interface FilterThumbProps {
    filter: FilterDefinition;
    selected: boolean;
    accent: string;
    onSelect: () => void;
    generateThumbnail: (canvas: HTMLCanvasElement, filter: FilterDefinition) => void;
}

export default function FilterThumb({
    filter,
    selected,
    accent,
    onSelect,
    generateThumbnail,
}: FilterThumbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            generateThumbnail(canvasRef.current, filter);
        }
    }, [filter, generateThumbnail]);

    return (
        <div
            onClick={onSelect}
            style={{
                cursor: "pointer",
                borderRadius: 8,
                overflow: "hidden",
                border: selected ? `2px solid ${accent}` : "2px solid transparent",
                background: selected ? `${accent}22` : "#2a2a30",
                transition: "all 0.15s",
                position: "relative",
            }}
            title={filter.name}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    display: "block",
                    objectFit: "cover",
                    borderRadius: 6,
                }}
                role="img"
                aria-label="Filter preview canvas"
            />
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "2px 4px",
                background: selected ? `${accent}cc` : "rgba(0,0,0,0.65)",
                color: "#fff",
                fontSize: 9,
                fontWeight: 600,
                textAlign: "center",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
            }}>
                {filter.icon} {filter.name}
            </div>
        </div>
    );
}
