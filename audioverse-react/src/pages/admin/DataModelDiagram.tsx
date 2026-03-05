/**
 * DataModelDiagram — Interactive ER diagram of the backend data model.
 *
 * Renders the auto-generated JSON from `GET /api/admin/diagrams/data-model`
 * as pure SVG with pan, zoom, search, group filtering and entity selection.
 *
 * Route: /admin/diagrams
 * Requires: Admin role (enforced by AdminLayout).
 *
 * Zero external diagram libraries — uses native SVG + React state.
 */
import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDataModelDiagramQuery, downloadDataModelDrawio } from "../../scripts/api/apiDiagrams";
import type { DiagramJson, DiagramGroup, DiagramNode, DiagramEdge } from "../../models/modelsDiagrams";

// ── Layout constants ───────────────────────────────────────────────
const NODE_WIDTH = 220;
const PROP_HEIGHT = 18;
const HEADER_HEIGHT = 50;
const NODE_PADDING = 10;
const GROUP_PADDING = 30;
const NODE_GAP_X = 260;
const NODE_GAP_Y = 30;
const ARROW_SIZE = 8;

// ── Helper: compute node height ────────────────────────────────────
function nodeHeight(node: DiagramNode): number {
    return HEADER_HEIGHT + node.properties.length * PROP_HEIGHT + NODE_PADDING;
}

// ── Layout engine: position nodes per group in grid ────────────────
interface PositionedNode {
    node: DiagramNode;
    group: DiagramGroup;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface GroupBox {
    group: DiagramGroup;
    x: number;
    y: number;
    w: number;
    h: number;
}

function layoutDiagram(diagram: DiagramJson): {
    nodes: PositionedNode[];
    groupBoxes: GroupBox[];
    totalW: number;
    totalH: number;
} {
    const positioned: PositionedNode[] = [];
    const groupBoxes: GroupBox[] = [];
    let groupOffsetY = GROUP_PADDING;

    for (const group of diagram.groups) {
        if (group.nodes.length === 0) continue;

        const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(group.nodes.length))));
        let rowMaxH = 0;
        let rowIdx = 0;
        let colIdx = 0;
        let localMaxX = 0;
        let localMaxY = 0;
        const startY = groupOffsetY + GROUP_PADDING + 30; // 30 for label

        for (const node of group.nodes) {
            const h = nodeHeight(node);
            const x = GROUP_PADDING + colIdx * NODE_GAP_X;
            const y = startY + rowIdx * (rowMaxH + NODE_GAP_Y);

            positioned.push({ node, group, x, y, w: NODE_WIDTH, h });

            localMaxX = Math.max(localMaxX, x + NODE_WIDTH);
            localMaxY = Math.max(localMaxY, y + h);
            rowMaxH = Math.max(rowMaxH, h);

            colIdx++;
            if (colIdx >= cols) {
                colIdx = 0;
                rowIdx++;
                // recalculate for next row — use a reasonable default
                const nextRowNodes = group.nodes.slice(
                    rowIdx * cols,
                    rowIdx * cols + cols,
                );
                rowMaxH = nextRowNodes.length > 0
                    ? Math.max(...nextRowNodes.map(nodeHeight))
                    : 0;
            }
        }

        const groupW = localMaxX + GROUP_PADDING;
        const groupH = localMaxY - groupOffsetY + GROUP_PADDING;

        groupBoxes.push({
            group,
            x: 0,
            y: groupOffsetY,
            w: groupW,
            h: groupH,
        });

        groupOffsetY += groupH + GROUP_PADDING * 2;
    }

    const totalW = Math.max(...groupBoxes.map(g => g.w), 600);
    const totalH = groupOffsetY;

    return { nodes: positioned, groupBoxes, totalW, totalH };
}

// ── Arrow path between two positioned nodes ────────────────────────
function edgePath(
    edge: DiagramEdge,
    nodeMap: Map<string, PositionedNode>,
): string | null {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) return null;

    const sx = src.x + src.w;
    const sy = src.y + src.h / 2;
    const tx = tgt.x;
    const ty = tgt.y + tgt.h / 2;

    const midX = (sx + tx) / 2;

    return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
}

// ── Main component ─────────────────────────────────────────────────
const DataModelDiagram: React.FC = () => {
    const { t } = useTranslation();
    const { data: diagram, isLoading, error } = useDataModelDiagramQuery();

    // ── UI state ───────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [selected, setSelected] = useState<DiagramNode | null>(null);

    // ── Pan / zoom state ───────────────────────────────────────────
    const [pan, setPan] = useState({ x: 20, y: 20 });
    const [zoom, setZoom] = useState(1);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    // ── Layout computation ─────────────────────────────────────────
    const layout = useMemo(() => {
        if (!diagram) return null;
        return layoutDiagram(diagram);
    }, [diagram]);

    const nodeMap = useMemo(() => {
        if (!layout) return new Map<string, PositionedNode>();
        const m = new Map<string, PositionedNode>();
        for (const pn of layout.nodes) {
            m.set(pn.node.id, pn);
        }
        return m;
    }, [layout]);

    // ── Filtering ──────────────────────────────────────────────────
    const searchLower = search.toLowerCase();
    const matchingIds = useMemo(() => {
        if (!layout || !searchLower) return new Set<string>();
        return new Set(
            layout.nodes
                .filter(pn =>
                    pn.node.name.toLowerCase().includes(searchLower) ||
                    pn.group.name.toLowerCase().includes(searchLower) ||
                    pn.node.description.toLowerCase().includes(searchLower) ||
                    pn.node.properties.some(p => p.toLowerCase().includes(searchLower)),
                )
                .map(pn => pn.node.id),
        );
    }, [layout, searchLower]);

    const visibleNodes = useMemo(() => {
        if (!layout) return [];
        let nodes = layout.nodes;
        if (activeGroup) {
            nodes = nodes.filter(pn => pn.group.name === activeGroup);
        }
        return nodes;
    }, [layout, activeGroup]);

    // ── Event handlers ─────────────────────────────────────────────
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.min(3, Math.max(0.15, z * delta)));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || e.shiftKey) {
            isPanning.current = true;
            panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            e.preventDefault();
        }
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning.current) return;
        setPan({
            x: e.clientX - panStart.current.x,
            y: e.clientY - panStart.current.y,
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
    }, []);

    // ── Keyboard pan ───────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const step = 40;
            if (e.key === "Escape") { setSelected(null); return; }
            if (e.key === "ArrowLeft") setPan(p => ({ ...p, x: p.x + step }));
            if (e.key === "ArrowRight") setPan(p => ({ ...p, x: p.x - step }));
            if (e.key === "ArrowUp") setPan(p => ({ ...p, y: p.y + step }));
            if (e.key === "ArrowDown") setPan(p => ({ ...p, y: p.y - step }));
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // ── Download .drawio ───────────────────────────────────────────
    const handleDownloadDrawio = useCallback(async () => {
        const blob = await downloadDataModelDrawio();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "auto-data-model.drawio";
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    // ── Render states ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ padding: 40, textAlign: "center" }}>
                <div className="spinner" />
                <p>{t("diagrams.loading", "Ładowanie diagramu...")}</p>
            </div>
        );
    }

    if (error || !diagram) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "#c33" }}>
                <h2>{t("diagrams.error", "Nie udało się załadować diagramu")}</h2>
                <p>{t("diagrams.errorHint", "Upewnij się, że backend został zbudowany (dotnet build AudioVerse.API).")}</p>
            </div>
        );
    }

    if (!layout) return null;

    const dimming = searchLower.length > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* ── Toolbar ──────────────────────────────────────── */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 16px",
                borderBottom: "1px solid #ddd",
                flexWrap: "wrap",
                background: "#fafafa",
            }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>
                    {t("diagrams.dataModel", "Model danych")}
                </h2>

                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t("diagrams.search", "Szukaj encji...")}
                    style={{
                        padding: "4px 8px",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        width: 220,
                        fontSize: 14,
                    }}
                />

                {/* Group filters */}
                {diagram.groups.map(g => (
                    <button
                        key={g.name}
                        onClick={() => setActiveGroup(activeGroup === g.name ? null : g.name)}
                        style={{
                            background: activeGroup === g.name ? g.fillColor : "#eee",
                            border: `1px solid ${g.strokeColor}`,
                            borderRadius: 4,
                            padding: "2px 8px",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: activeGroup === g.name ? 600 : 400,
                        }}
                    >
                        {g.name} ({g.nodes.length})
                    </button>
                ))}

                {/* Zoom controls */}
                <span style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
                    <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} title="Zoom in"
                        style={{ padding: "2px 8px", cursor: "pointer" }}>
                        +
                    </button>
                    <span style={{ fontSize: 12, minWidth: 40, textAlign: "center" }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={() => setZoom(z => Math.max(0.15, z / 1.2))} title="Zoom out"
                        style={{ padding: "2px 8px", cursor: "pointer" }}>
                        −
                    </button>
                    <button onClick={() => { setZoom(1); setPan({ x: 20, y: 20 }); }}
                        title="Reset view" style={{ padding: "2px 8px", cursor: "pointer" }}>
                        ⌂
                    </button>
                </span>

                {/* Download */}
                <button onClick={handleDownloadDrawio} title="Pobierz .drawio"
                    style={{ padding: "2px 8px", cursor: "pointer" }}>
                    📥 .drawio
                </button>
            </div>

            {/* ── SVG canvas ───────────────────────────────────── */}
            <div style={{ flex: 1, overflow: "hidden", position: "relative", cursor: isPanning.current ? "grabbing" : "default" }}>
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ display: "block" }}
                >
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                        {/* Group boxes */}
                        {layout.groupBoxes
                            .filter(gb => !activeGroup || gb.group.name === activeGroup)
                            .map(gb => (
                                <g key={`group-${gb.group.name}`}>
                                    <rect
                                        x={gb.x}
                                        y={gb.y}
                                        width={gb.w}
                                        height={gb.h}
                                        rx={8}
                                        fill={gb.group.fillColor + "44"}
                                        stroke={gb.group.strokeColor}
                                        strokeWidth={1.5}
                                        strokeDasharray="6 3"
                                    />
                                    <text
                                        x={gb.x + 12}
                                        y={gb.y + 22}
                                        fontSize={15}
                                        fontWeight={700}
                                        fill={gb.group.strokeColor}
                                    >
                                        {gb.group.name}
                                    </text>
                                </g>
                            ))}

                        {/* Edges */}
                        {diagram.edges.map((edge, i) => {
                            const path = edgePath(edge, nodeMap);
                            if (!path) return null;
                            const src = nodeMap.get(edge.source);
                            const tgt = nodeMap.get(edge.target);
                            // hide edges when group-filtering and either end is hidden
                            if (activeGroup && src && tgt && src.group.name !== activeGroup && tgt.group.name !== activeGroup) return null;

                            return (
                                <g key={`edge-${i}`}>
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="#666"
                                        strokeWidth={1.2}
                                        strokeDasharray={edge.dashed ? "6 4" : undefined}
                                        markerEnd="url(#arrowhead)"
                                    />
                                    {/* label at midpoint */}
                                    {src && tgt && (
                                        <text
                                            x={(src.x + src.w + tgt.x) / 2}
                                            y={(src.y + src.h / 2 + tgt.y + tgt.h / 2) / 2 - 6}
                                            fontSize={10}
                                            fill="#666"
                                            textAnchor="middle"
                                        >
                                            {edge.label} ({edge.propertyName})
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Entity nodes */}
                        {visibleNodes.map(pn => {
                            const isDim = dimming && !matchingIds.has(pn.node.id);
                            const isSel = selected?.id === pn.node.id;

                            return (
                                <g
                                    key={pn.node.id}
                                    style={{
                                        opacity: isDim ? 0.25 : 1,
                                        cursor: "pointer",
                                        transition: "opacity 0.2s",
                                    }}
                                    onClick={() => setSelected(isSel ? null : pn.node)}
                                >
                                    {/* Card background */}
                                    <rect
                                        x={pn.x}
                                        y={pn.y}
                                        width={pn.w}
                                        height={pn.h}
                                        rx={6}
                                        fill={pn.node.fillColor}
                                        stroke={isSel ? "#333" : pn.node.strokeColor}
                                        strokeWidth={isSel ? 2.5 : 1.2}
                                    />
                                    {/* Header stripe */}
                                    <rect
                                        x={pn.x}
                                        y={pn.y}
                                        width={pn.w}
                                        height={HEADER_HEIGHT}
                                        rx={6}
                                        fill={pn.node.strokeColor + "33"}
                                    />
                                    {/* Icon + Name */}
                                    <text
                                        x={pn.x + 10}
                                        y={pn.y + 20}
                                        fontSize={14}
                                        fontWeight={700}
                                        fill="#222"
                                    >
                                        {pn.node.icon} {pn.node.name}
                                    </text>
                                    {/* Description */}
                                    <text
                                        x={pn.x + 10}
                                        y={pn.y + 38}
                                        fontSize={10}
                                        fill="#555"
                                    >
                                        {pn.node.description}
                                    </text>
                                    {/* Properties */}
                                    {pn.node.properties.map((prop, pi) => (
                                        <text
                                            key={pi}
                                            x={pn.x + 10}
                                            y={pn.y + HEADER_HEIGHT + 14 + pi * PROP_HEIGHT}
                                            fontSize={11}
                                            fill="#333"
                                            fontFamily="monospace"
                                        >
                                            {prop}
                                        </text>
                                    ))}
                                </g>
                            );
                        })}
                    </g>

                    {/* Arrowhead marker */}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth={ARROW_SIZE}
                            markerHeight={ARROW_SIZE}
                            refX={ARROW_SIZE}
                            refY={ARROW_SIZE / 2}
                            orient="auto"
                        >
                            <polygon
                                points={`0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}`}
                                fill="#666"
                            />
                        </marker>
                    </defs>
                </svg>
            </div>

            {/* ── Detail panel ─────────────────────────────────── */}
            {selected && (
                <div style={{
                    borderTop: "2px solid #ccc",
                    padding: "12px 16px",
                    background: "#f9f9f9",
                    maxHeight: 180,
                    overflow: "auto",
                    display: "flex",
                    gap: 24,
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>
                            {selected.icon} {selected.name}
                        </h3>
                        <p style={{ margin: "4px 0", fontSize: 12, color: "#555" }}>
                            {selected.description}
                        </p>
                        <code style={{ fontSize: 10, color: "#888" }}>{selected.id}</code>
                    </div>
                    <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 12 }}>Properties:</strong>
                        <ul style={{ margin: "4px 0", paddingLeft: 16, fontSize: 12, fontFamily: "monospace" }}>
                            {selected.properties.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                    </div>
                    {/* Edges from/to selected */}
                    <div>
                        <strong style={{ fontSize: 12 }}>Relations:</strong>
                        <ul style={{ margin: "4px 0", paddingLeft: 16, fontSize: 12 }}>
                            {diagram.edges
                                .filter(e => e.source === selected.id || e.target === selected.id)
                                .map((e, i) => (
                                    <li key={i}>
                                        {e.propertyName} → {e.source === selected.id ? e.target.split(".").pop() : e.source.split(".").pop()} ({e.label})
                                    </li>
                                ))}
                        </ul>
                    </div>
                    <button
                        onClick={() => setSelected(null)}
                        style={{
                            alignSelf: "flex-start",
                            background: "none",
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "2px 8px",
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ── Footer ───────────────────────────────────────── */}
            <div style={{
                padding: "4px 16px",
                fontSize: 11,
                color: "#888",
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
            }}>
                <span>
                    {diagram.groups.length} {t("diagrams.groups", "grup")} ·{" "}
                    {diagram.groups.reduce((s, g) => s + g.nodes.length, 0)} {t("diagrams.entities", "encji")} ·{" "}
                    {diagram.edges.length} {t("diagrams.relations", "relacji")}
                </span>
                <span>
                    {t("diagrams.generatedAt", "Wygenerowano")}: {new Date(diagram.generatedAt).toLocaleString()} ·{" "}
                    Shift+drag = pan · Scroll = zoom · Esc = deselect
                </span>
            </div>
        </div>
    );
};

export default DataModelDiagram;
