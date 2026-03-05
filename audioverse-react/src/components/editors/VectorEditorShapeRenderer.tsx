import React from "react";
import { VShape, polygonPoints, starPoints } from "./vectorEditorTypes";

interface ShapeRendererProps {
  shape: VShape;
  selected: boolean;
  zoom: number;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ shape: s, selected, zoom }) => {
  const selStroke = selected ? "rgba(85,102,204,0.6)" : undefined;
  const gProps: Record<string, string | number> = {};
  if (s.opacity < 1) gProps.opacity = s.opacity;
  if (s.rotation && s.type !== "polygon" && s.type !== "star") {
    gProps.transform = `rotate(${s.rotation} ${s.x + s.w / 2} ${s.y + s.h / 2})`;
  }
  const selBox = selected ? (
    <rect
      x={s.x - 1}
      y={s.y - 1}
      width={s.w + 2}
      height={s.h + 2}
      fill="none"
      stroke={selStroke}
      strokeWidth={2 / zoom}
      strokeDasharray={`${4 / zoom}`}
    />
  ) : null;
  switch (s.type) {
    case "rect":
      return (
        <g {...gProps}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h}
            fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
          {selBox}
        </g>
      );
    case "roundrect":
      return (
        <g {...gProps}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx || 12}
            fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
          {selBox}
        </g>
      );
    case "ellipse":
      return (
        <g {...gProps}>
          <ellipse cx={s.x + s.w / 2} cy={s.y + s.h / 2} rx={s.w / 2} ry={s.h / 2}
            fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
          {selBox}
        </g>
      );
    case "line":
      return (
        <g {...gProps}>
          <line x1={s.x} y1={s.y} x2={s.x2} y2={s.y2}
            stroke={s.stroke} strokeWidth={s.strokeWidth} />
          {selected && (
            <>
              <circle cx={s.x} cy={s.y} r={4 / zoom} fill="#5566cc" />
              <circle cx={s.x2} cy={s.y2} r={4 / zoom} fill="#5566cc" />
            </>
          )}
        </g>
      );
    case "arrow":
      return (
        <g {...gProps}>
          <defs>
            <marker id={`ah-${s.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={s.stroke} />
            </marker>
          </defs>
          <line x1={s.x} y1={s.y} x2={s.x2} y2={s.y2}
            stroke={s.stroke} strokeWidth={s.strokeWidth} markerEnd={`url(#ah-${s.id})`} />
          {selected && (
            <>
              <circle cx={s.x} cy={s.y} r={4 / zoom} fill="#5566cc" />
              <circle cx={s.x2} cy={s.y2} r={4 / zoom} fill="#5566cc" />
            </>
          )}
        </g>
      );
    case "polyline":
      if (!s.points?.length) return null;
      return (
        <g {...gProps}>
          <polyline
            points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
          {selected &&
            s.points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3 / zoom}
                fill="#5566cc" stroke="#fff" strokeWidth={1 / zoom} />
            ))}
        </g>
      );
    case "polygon": {
      const cx2 = s.x + s.w / 2;
      const cy2 = s.y + s.h / 2;
      const r2 = Math.min(s.w, s.h) / 2;
      const pts = polygonPoints(cx2, cy2, r2, s.sides || 6, s.rotation);
      return (
        <g opacity={s.opacity < 1 ? s.opacity : undefined}>
          <polygon points={pts} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
          {selBox}
        </g>
      );
    }
    case "star": {
      const cx2 = s.x + s.w / 2;
      const cy2 = s.y + s.h / 2;
      const r2 = Math.min(s.w, s.h) / 2;
      const ir = r2 * (s.innerRadius || 0.4);
      const pts = starPoints(cx2, cy2, r2, ir, s.sides || 5, s.rotation);
      return (
        <g opacity={s.opacity < 1 ? s.opacity : undefined}>
          <polygon points={pts} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
          {selBox}
        </g>
      );
    }
    case "text":
      return (
        <g {...gProps}>
          <text x={s.x} y={s.y + (s.fontSize || 24)} fontSize={s.fontSize || 24}
            fontFamily={s.fontFamily || "sans-serif"} fill={s.fill}>
            {s.text}
          </text>
          {selBox}
        </g>
      );
    default:
      return null;
  }
};
