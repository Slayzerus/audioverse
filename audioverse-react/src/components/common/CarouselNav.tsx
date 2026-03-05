import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { Focusable } from "./Focusable";
import { useGamepadNavigation } from "../../contexts/GamepadNavigationContext";

/* ── Public types ── */
export interface CarouselItem {
    id: string;
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
    color?: string;
    /** If present, this item can be drilled into */
    children?: CarouselItem[];
    /** Arbitrary payload passed back on select */
    data?: unknown;
}

export interface CarouselLevel {
    title: string;
    items: CarouselItem[];
}

export interface CarouselNavProps {
    /** All levels — level 0 is the root */
    levels: CarouselLevel[];
    /** Fired when a leaf item is confirmed */
    onSelect?: (item: CarouselItem, levelIndex: number) => void;
    /** Fired whenever any item gets focus */
    onFocus?: (item: CarouselItem, levelIndex: number) => void;
    /** Fired when user drills into a level (selects an item that has children) */
    onDrillDown?: (item: CarouselItem, levelIndex: number) => void;
    /** Fired when user goes back a level */
    onDrillUp?: (levelIndex: number) => void;
    /** Unique prefix for Focusable IDs */
    idPrefix?: string;
    /** Number of items visible at once (for card sizing). Default 5 */
    visibleCount?: number;
    /** Card height in px. Default 100 */
    cardHeight?: number;
    /** Enable hierarchical drill-down navigation. Default true */
    hierarchical?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

/* ── Helpers ── */
const SCROLL_BEHAVIOR: ScrollIntoViewOptions = { block: "nearest", inline: "center", behavior: "smooth" };

/* ── Card ── */
const CarouselCard: React.FC<{
    item: CarouselItem;
    focusId: string;
    height: number;
    hasChildren: boolean;
    onActivate: () => void;
}> = ({ item, focusId, height, hasChildren, onActivate }) => (
    <Focusable id={focusId} highlightMode="scale" style={{ flex: "0 0 auto" }}>
        <button
            onClick={onActivate}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                height,
                padding: "12px 20px",
                borderRadius: 12,
                border: `1px solid ${item.color ?? "var(--border-primary)"}40`,
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "transform .15s, box-shadow .15s",
                minWidth: 140,
            }}
            aria-label={item.label}
        >
            {item.icon && <span style={{ fontSize: 28, color: item.color ?? "var(--nav-active)" }}>{item.icon}</span>}
            <span style={{ fontWeight: 600, fontSize: 14, textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
            {item.sublabel && (
                <span style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center" }}>{item.sublabel}</span>
            )}
            {hasChildren && (
                <span style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>▶</span>
            )}
        </button>
    </Focusable>
);

/* ── Breadcrumb bar ── */
const Breadcrumbs: React.FC<{
    path: { title: string; idx: number }[];
    onNavigate: (levelIdx: number) => void;
    idPrefix: string;
}> = ({ path, onNavigate, idPrefix }) => {
    if (path.length <= 1) return null;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, fontSize: 13, flexWrap: "wrap" }}>
            {path.map((p, i) => (
                <React.Fragment key={p.idx}>
                    {i > 0 && <span style={{ color: "var(--text-secondary)", margin: "0 2px" }}>›</span>}
                    {i < path.length - 1 ? (
                        <Focusable id={`${idPrefix}bc-${p.idx}`} highlightMode="glow" style={{ display: "inline-block" }}>
                            <button
                                onClick={() => onNavigate(p.idx)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--nav-active)",
                                    cursor: "pointer",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontWeight: 500,
                                }}
                            >
                                {p.title}
                            </button>
                        </Focusable>
                    ) : (
                        <span style={{ color: "var(--text-primary)", fontWeight: 600, padding: "2px 6px" }}>{p.title}</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════ */
/* ── CarouselNav ── */
/* ══════════════════════════════════════════════════════════════ */

export const CarouselNav: React.FC<CarouselNavProps> = React.memo(function CarouselNav({
    levels,
    onSelect,
    onFocus,
    onDrillDown,
    onDrillUp,
    idPrefix = "carousel-",
    visibleCount = 5,
    cardHeight = 100,
    hierarchical = true,
    className,
    style,
}) {
    const trackRef = useRef<HTMLDivElement>(null);
    const { activeId } = useGamepadNavigation();

    /* ─── Hierarchical state ─── */
    const [levelStack, setLevelStack] = useState<number[]>([0]);
    const currentLevelIdx = levelStack[levelStack.length - 1];

    // Reset stack if levels change
    useEffect(() => {
        setLevelStack([0]);
    }, [levels.length]);

    const currentLevel = levels[currentLevelIdx] ?? levels[0];
    const currentItems = currentLevel?.items ?? [];

    /* ─── Breadcrumb path ─── */
    const breadcrumbPath = useMemo(
        () => levelStack.map(idx => ({ title: levels[idx]?.title ?? `Level ${idx}`, idx })),
        [levelStack, levels],
    );

    /* ─── Actions ─── */
    const drillInto = useCallback(
        (item: CarouselItem, nextLevelIdx: number) => {
            if (!hierarchical) return;
            if (nextLevelIdx >= levels.length) return;
            setLevelStack(prev => [...prev, nextLevelIdx]);
            onDrillDown?.(item, nextLevelIdx);
        },
        [hierarchical, levels.length, onDrillDown],
    );

    const drillUp = useCallback(
        (toIdx: number) => {
            setLevelStack(prev => {
                const cutAt = prev.indexOf(toIdx);
                if (cutAt < 0) return [0];
                return prev.slice(0, cutAt + 1);
            });
            onDrillUp?.(toIdx);
        },
        [onDrillUp],
    );

    const handleActivate = useCallback(
        (item: CarouselItem, levelIndex: number) => {
            if (hierarchical && item.children && item.children.length > 0) {
                // Find the level that corresponds to this item's children
                const nextIdx = levels.findIndex(l => l.items === item.children);
                if (nextIdx >= 0) {
                    drillInto(item, nextIdx);
                    return;
                }
            }
            onSelect?.(item, levelIndex);
        },
        [hierarchical, levels, drillInto, onSelect],
    );

    /* ─── Auto-scroll track when focus moves ─── */
    useEffect(() => {
        if (!activeId?.startsWith(idPrefix) || !trackRef.current) return;
        const el = trackRef.current.querySelector(`[aria-label="${activeId.replace(idPrefix + "item-", "")}"]`);
        if (el) el.scrollIntoView(SCROLL_BEHAVIOR);
    }, [activeId, idPrefix]);

    /* ─── Card width ─── */
    const gap = 10;

    return (
        <div className={className} style={{ ...style, position: "relative" }}>
            {/* Breadcrumbs */}
            {hierarchical && (
                <Breadcrumbs path={breadcrumbPath} onNavigate={drillUp} idPrefix={idPrefix} />
            )}

            {/* Level title */}
            {currentLevel && (
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: "var(--text-primary)" }}>
                    {currentLevel.title}
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 8 }}>
                        ({currentItems.length})
                    </span>
                </div>
            )}

            {/* Carousel track */}
            <div
                ref={trackRef}
                style={{
                    display: "flex",
                    gap,
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollSnapType: "x mandatory",
                    paddingBottom: 8,
                    /* Hide scrollbar for clean TV look */
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
                role="listbox"
                aria-label={currentLevel?.title}
            >
                {currentItems.map((item, idx) => (
                    <div
                        key={item.id}
                        style={{
                            flex: `0 0 calc((100% - ${(visibleCount - 1) * gap}px) / ${visibleCount})`,
                            scrollSnapAlign: "start",
                        }}
                    >
                        <CarouselCard
                            item={item}
                            focusId={`${idPrefix}item-${item.id}`}
                            height={cardHeight}
                            hasChildren={!!(hierarchical && item.children?.length)}
                            onActivate={() => {
                                handleActivate(item, currentLevelIdx);
                                onFocus?.(item, idx);
                            }}
                        />
                    </div>
                ))}

                {currentItems.length === 0 && (
                    <div style={{ padding: 20, color: "var(--text-secondary)", textAlign: "center", width: "100%" }}>
                        No items
                    </div>
                )}
            </div>

            {/* Edge arrows (decorative, gamepad users use D-pad) */}
            {currentItems.length > visibleCount && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: hierarchical ? 70 : 30,
                            height: cardHeight,
                            width: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(90deg, var(--bg-primary) 0%, transparent 100%)",
                            pointerEvents: "none",
                            fontSize: 18,
                            color: "var(--text-secondary)",
                            opacity: 0.7,
                        }}
                    >
                        ◀
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: hierarchical ? 70 : 30,
                            height: cardHeight,
                            width: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(270deg, var(--bg-primary) 0%, transparent 100%)",
                            pointerEvents: "none",
                            fontSize: 18,
                            color: "var(--text-secondary)",
                            opacity: 0.7,
                        }}
                    >
                        ▶
                    </div>
                </>
            )}
        </div>
    );
});
CarouselNav.displayName = "CarouselNav";

export default CarouselNav;
