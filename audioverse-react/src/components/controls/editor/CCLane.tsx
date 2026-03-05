
import React from "react";
import { useTranslation } from 'react-i18next';


export type CurveHandleType = 'linear' | 'step' | 'exp';


export interface CCLaneEvent {
  id: number;
  cc: number; // Controller number
  value: number; // 0-127
  time: number; // seconds
  handleType?: CurveHandleType; // Optional per-point handle type
}



interface CCLaneProps {
  ccEvents: CCLaneEvent[];
  onAddEvent: (cc: number, value: number, time: number) => void;
  onUpdateEvent: (id: number, value: number, time: number, handleType?: CurveHandleType) => void;
  onRemoveEvent: (id: number) => void;
  ccType: number; // e.g. 1=mod wheel, 11=expression
  duration: number;
  width: number;
  height?: number;
  curveType?: CurveHandleType; // Added curve type
}

const CCLane: React.FC<CCLaneProps> = ({
  ccEvents,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
  ccType,
  duration,
  width,
  height = 60,
  curveType,
}) => {
  // Advanced editing: drag/move points, highlight selected, linear interpolation preview, double-click add, keyboard delete, tooltip
  const svgRef = React.useRef<SVGSVGElement>(null);
  const { t } = useTranslation();
  const [dragId, setDragId] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{dx: number, dy: number} | null>(null);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  // Sort events by time
  const sortedEvents = [...ccEvents].sort((a, b) => a.time - b.time);

  // Convert event to SVG coords
  const toXY = (ev: CCLaneEvent) => [ (ev.time / duration) * width, ((127 - ev.value) / 127) * height ];
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  // Mouse handlers
  const handleAdd = (e: React.MouseEvent) => {
    // Only add if not clicking on a point
    if (e.target instanceof SVGCircleElement) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = clamp((x / width) * duration, 0, duration);
    const value = clamp(127 - Math.round((y / height) * 127), 0, 127);
    onAddEvent(ccType, value, time);
  };

  const handleDown = (ev: CCLaneEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragId(ev.id);
    setSelectedId(ev.id);
    const [cx, cy] = toXY(ev);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragOffset({ dx: e.clientX - rect.left - cx, dy: e.clientY - rect.top - cy });
  };

  const handleMove = (e: React.MouseEvent) => {
    if (dragId == null || !dragOffset) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(e.clientX - rect.left - dragOffset.dx, 0, width);
    const y = clamp(e.clientY - rect.top - dragOffset.dy, 0, height);
    const time = clamp((x / width) * duration, 0, duration);
    const value = clamp(127 - Math.round((y / height) * 127), 0, 127);
    onUpdateEvent(dragId, value, time);
  };

  const handleUp = () => {
    setDragId(null);
    setDragOffset(null);
  };


  // Keyboard delete for selected point
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId != null) {
        onRemoveEvent(selectedId);
        setSelectedId(null);
      }
    };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [selectedId, onRemoveEvent]);

  // Mouse drag listeners
  React.useEffect(() => {
    if (dragId != null) {
      window.addEventListener('mousemove', handleMove as unknown as EventListener);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove as unknown as EventListener);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  });

  // Tooltip for value/time
  const [tooltip, setTooltip] = React.useState<{x: number, y: number, text: string} | null>(null);

  const handleMouseOver = (ev: CCLaneEvent, _e: React.MouseEvent) => {
    const [cx, cy] = toXY(ev);
    setTooltip({ x: cx + 10, y: cy - 10, text: `Val: ${ev.value}, Time: ${ev.time.toFixed(2)}s` });
  };
  const handleMouseOut = () => setTooltip(null);

  // Double-click to add
  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = clamp((x / width) * duration, 0, duration);
    const value = clamp(127 - Math.round((y / height) * 127), 0, 127);
    onAddEvent(ccType, value, time);
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: 'var(--surface-muted, #f3f3f3)', border: '1px solid var(--border, #bbb)', cursor: dragId ? 'grabbing' : 'crosshair', display: 'block' }}
      onClick={handleAdd}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
    >
      {/* Grid lines */}
      {[...Array(9)].map((_, i) => (
        <line
          key={i}
          x1={0}
          y1={(i * height) / 8}
          x2={width}
          y2={(i * height) / 8}
          stroke="var(--border-muted, #ddd)"
          strokeWidth={i === 0 || i === 8 ? 2 : 1}
        />
      ))}
      {/* Interpolated line */}
      {sortedEvents.length > 1 && (
        <polyline
          fill="none"
          stroke="var(--accent, #1976d2)"
          strokeWidth={2}
          points={sortedEvents.map(ev => toXY(ev).join(",")).join(' ')}
        />
      )}
      {/* Points and per-point handle type selector */}
      {sortedEvents.map(ev => {
        const [cx, cy] = toXY(ev);
        return (
          <g key={ev.id}>
            <circle
              cx={cx}
              cy={cy}
              r={selectedId === ev.id ? 8 : 6}
              fill={selectedId === ev.id ? "var(--accent, #1976d2)" : "var(--accent-light, #90caf9)"}
              stroke="var(--accent, #1976d2)"
              strokeWidth={selectedId === ev.id ? 3 : 2}
              style={{ cursor: 'pointer' }}
              onMouseDown={e => handleDown(ev, e)}
              onContextMenu={e => {
                e.preventDefault();
                onRemoveEvent(ev.id);
              }}
              onClick={e => { e.stopPropagation(); setSelectedId(ev.id); }}
              onMouseOver={e => handleMouseOver(ev, e)}
              onMouseOut={handleMouseOut}
            />
            {selectedId === ev.id && (
              <foreignObject x={cx + 10} y={cy - 18} width={90} height={30} style={{ pointerEvents: 'auto' }}>
                <div style={{ fontSize: 12, background: 'var(--surface-bg, #fff)', border: '1px solid var(--border, #bbb)', borderRadius: 4, padding: '2px 6px', display: 'inline-block' }}>
                  <label style={{ marginRight: 4 }}>{t('ccLane.curve', 'Curve')}:</label>
                  <select
                    value={ev.handleType || curveType || 'linear'}
                    onChange={e => {
                      // Update handle type for this event
                      onUpdateEvent(ev.id, ev.value, ev.time, e.target.value as CurveHandleType);
                    }}
                  >
                    <option value="linear">{t('ccLane.linear', 'Linear')}</option>
                    <option value="step">{t('ccLane.step', 'Step')}</option>
                    <option value="exp">{t('ccLane.exponential', 'Exponential')}</option>
                  </select>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
      {/* Tooltip */}
      {tooltip && (
        <g pointerEvents="none">
          <rect x={tooltip.x} y={tooltip.y - 18} width={90} height={20} fill="var(--surface-bg, #fff)" stroke="var(--accent, #1976d2)" rx={4} />
          <text x={tooltip.x + 6} y={tooltip.y - 4} fontSize={13} fill="var(--accent, #1976d2)">{tooltip.text}</text>
        </g>
      )}
      {/* CC label */}
      <text x={6} y={16} fontSize={14} fill="var(--accent, #1976d2)">CC{ccType}</text>
    </svg>
  );
};

export default CCLane;
