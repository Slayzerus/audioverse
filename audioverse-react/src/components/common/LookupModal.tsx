/**
 * LookupModal<T> — Universal item picker with 3 navigation modes.
 *
 * Mode 1 (Basic):   Standard dropdowns + search (mouse-friendly)
 * Mode 2 (Gamepad): Hierarchical CarouselNav levels (pad-friendly, drill down)
 * Mode 3 (Oneline): Same hierarchy but branches swap inline (B goes back)
 *
 * Switch modes: LB/RB on gamepad, Ctrl+Left/Right on keyboard.
 * Below filters: scrollable item list with select + info.
 *
 * Works for songs, games, movies, or anything else — just configure
 * filters[], getId, getTitle, getSubtitle, getImage, getBadges.
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import CarouselNav, { type CarouselItem, type CarouselLevel } from "./CarouselNav";
import { Focusable } from "./Focusable";

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                        */
/* ═══════════════════════════════════════════════════════════════ */

export type LookupMode = "basic" | "gamepad" | "oneline";

/** Describes one filterable dimension (genre, year, player count, etc.) */
export interface LookupFilterDef<T> {
    /** Unique key, e.g. "genre", "year", "players" */
    id: string;
    /** Display label for carousel root item, e.g. "Wg gatunku" */
    label: string;
    /** Label for the "all" dropdown option, e.g. "Gatunek: Wszystkie" */
    allLabel: string;
    /** Emoji or icon string for carousel cards */
    icon: string;
    /** Accent color for carousel cards */
    color: string;
    /** Extract the filterable value from an item (return undefined to skip) */
    getValue: (item: T) => string | number | undefined | null;
    /** Optional: custom sort for the dropdown/carousel values. Default: alphabetical */
    sortValues?: (a: string, b: string) => number;
}

export interface LookupModalProps<T> {
    show: boolean;
    onClose: () => void;
    onSelect: (item: T) => void;
    /** Optional: show item info panel */
    onInfo?: (item: T) => void;
    /** All items to browse */
    items: T[];
    isLoading?: boolean;
    /** Initial mode */
    initialMode?: LookupMode;

    /* ── Display configuration ── */
    /** Modal title, e.g. "Wybierz piosenkę" */
    title: string;
    /** FontAwesome icon class for the title, e.g. "fa fa-music" */
    titleIcon?: string;
    /** Search input placeholder */
    searchPlaceholder?: string;
    /** Noun for item counts, e.g. "piosenek" → "15 piosenek łącznie" */
    itemsLabel?: string;

    /* ── Filter dimensions ── */
    filters: LookupFilterDef<T>[];

    /* ── Item accessors ── */
    /** Unique ID for React keys and Focusable */
    getId: (item: T) => string | number;
    /** Primary text (song title, game name, movie title) */
    getTitle: (item: T) => string;
    /** Secondary text (artist, publisher, director) */
    getSubtitle: (item: T) => string;
    /** Thumbnail/cover image URL */
    getImage?: (item: T) => string | undefined;
    /** Colored badge chips shown on the right */
    getBadges?: (item: T) => { label: string; color: string }[];
    /** Extra small text on the right (year, duration, etc.) */
    getExtra?: (item: T) => string | undefined;
    /** Fields to search against (returns concatenated searchable text) */
    getSearchText?: (item: T) => string;

    /** Optional: custom idPrefix for Focusable IDs. Default "lookup-" */
    idPrefix?: string;
}

const MODE_CYCLE: LookupMode[] = ["basic", "gamepad", "oneline"];
const MODE_ICONS: Record<LookupMode, string> = { basic: "🖱️", gamepad: "🎮", oneline: "📝" };
const MODE_LABELS: Record<LookupMode, string> = { basic: "Standard", gamepad: "Pad", oneline: "Oneline" };

const NO_IMAGE_SVG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23333'/%3E%3Ctext x='24' y='28' text-anchor='middle' fill='%23999' font-size='14'%3E?%3C/text%3E%3C/svg%3E";

/* ═══════════════════════════════════════════════════════════════ */
/*  LookupModal                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function LookupModalInner<T>(
    {
        show,
        onClose,
        onSelect,
        onInfo,
        items,
        isLoading = false,
        initialMode = "basic",
        title,
        titleIcon,
        searchPlaceholder,
        itemsLabel,
        filters,
        getId,
        getTitle,
        getSubtitle,
        getImage,
        getBadges,
        getExtra,
        getSearchText,
        idPrefix = "lookup-",
    }: LookupModalProps<T>,
) {
    const { t } = useTranslation();

    /* ── Mode ── */
    const [mode, setMode] = useState<LookupMode>(initialMode);

    const cycleMode = useCallback((dir: 1 | -1) => {
        setMode(prev => {
            const idx = MODE_CYCLE.indexOf(prev);
            return MODE_CYCLE[(idx + dir + MODE_CYCLE.length) % MODE_CYCLE.length];
        });
    }, []);

    /* ── Filter state: one value per filter dimension ── */
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});

    const setFilter = useCallback((filterId: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [filterId]: value }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilterValues({});
    }, []);

    /* ── Oneline state ── */
    const [onelineCategory, setOnelineCategory] = useState<string | null>(null);
    const [onelineValue, setOnelineValue] = useState<string | null>(null);

    /* ── Extract unique values per filter dimension ── */
    const filterUniqueValues = useMemo(() => {
        const result: Record<string, string[]> = {};
        for (const f of filters) {
            const vals = [...new Set(
                items.map(item => {
                    const v = f.getValue(item);
                    return v != null ? String(v) : null;
                }).filter((v): v is string => v != null && v !== "")
            )];
            if (f.sortValues) {
                vals.sort(f.sortValues);
            } else {
                vals.sort();
            }
            result[f.id] = vals;
        }
        return result;
    }, [items, filters]);

    /* ── Filter items ── */
    const filteredItems = useMemo(() => {
        let list = items;

        // Text search
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(item => {
                const text = getSearchText
                    ? getSearchText(item)
                    : `${getTitle(item)} ${getSubtitle(item)}`;
                return text.toLowerCase().includes(q);
            });
        }

        // Apply each filter dimension
        for (const f of filters) {
            const effective = mode === "oneline" && onelineCategory === f.id
                ? onelineValue
                : (filterValues[f.id] || null);
            if (effective) {
                list = list.filter(item => String(f.getValue(item)) === effective);
            }
        }

        return list;
    }, [items, search, filterValues, filters, mode, onelineCategory, onelineValue, getSearchText, getTitle, getSubtitle]);

    /* ── Keyboard: Ctrl+Left/Right switch mode, Escape close ── */
    useEffect(() => {
        if (!show) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { onClose(); return; }
            if (e.ctrlKey && e.key === "ArrowRight") { e.preventDefault(); cycleMode(1); }
            if (e.ctrlKey && e.key === "ArrowLeft") { e.preventDefault(); cycleMode(-1); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [show, onClose, cycleMode]);

    /* ── Gamepad LB/RB polling ── */
    useEffect(() => {
        if (!show) return;
        let animFrame: number;
        let prevLB = false, prevRB = false;
        const poll = () => {
            const gp = navigator.getGamepads?.()[0];
            if (gp) {
                const lb = gp.buttons[4]?.pressed ?? false;
                const rb = gp.buttons[5]?.pressed ?? false;
                if (lb && !prevLB) cycleMode(-1);
                if (rb && !prevRB) cycleMode(1);
                prevLB = lb;
                prevRB = rb;
            }
            animFrame = requestAnimationFrame(poll);
        };
        animFrame = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(animFrame);
    }, [show, cycleMode]);

    /* ── Carousel levels (gamepad mode) — built from filter definitions ── */
    const [carouselCategory, setCarouselCategory] = useState<string | null>(null);

    const carouselLevels = useMemo((): CarouselLevel[] => {
        const allItem: CarouselItem = {
            id: "all",
            label: t('lookup.all', 'Wszystkie'),
            icon: "📋",
            color: "#42a5f5",
        };
        const rootItems: CarouselItem[] = [
            allItem,
            ...filters.map(f => ({
                id: f.id,
                label: f.label,
                icon: f.icon,
                color: f.color,
            })),
        ];
        const result: CarouselLevel[] = [{
            title: t('lookup.browseBy', 'Przeglądaj wg'),
            items: rootItems,
        }];

        // Add sub-level for active category
        const activeDef = filters.find(f => f.id === carouselCategory);
        const activeVals = carouselCategory ? filterUniqueValues[carouselCategory] : null;
        if (activeDef && activeVals && activeVals.length > 0) {
            result.push({
                title: activeDef.label,
                items: activeVals.map(v => ({
                    id: `${activeDef.id}-${v}`,
                    label: v,
                    icon: activeDef.icon,
                    color: activeDef.color,
                    data: v,
                })),
            });
        }

        return result;
    }, [t, filters, filterUniqueValues, carouselCategory]);

    const handleCarouselSelect = useCallback((item: CarouselItem, levelIndex: number) => {
        if (levelIndex === 0) {
            if (item.id === "all") {
                setCarouselCategory(null);
                clearAllFilters();
            } else {
                setCarouselCategory(item.id);
            }
        } else if (carouselCategory) {
            setFilter(carouselCategory, item.data as string);
        }
    }, [carouselCategory, setFilter, clearAllFilters]);

    /* ── Oneline navigation — built from filter definitions ── */
    const onelineRootOptions = useMemo(() => [
        { id: "all", label: t('lookup.all', 'Wszystkie'), icon: "📋" },
        ...filters.map(f => ({ id: f.id, label: f.label, icon: f.icon })),
    ], [t, filters]);

    const onelineSubOptions = useMemo(() => {
        if (!onelineCategory || onelineCategory === "all") return [];
        const vals = filterUniqueValues[onelineCategory] ?? [];
        return vals.map(v => ({ id: v, label: v }));
    }, [onelineCategory, filterUniqueValues]);

    if (!show) return null;

    const placeholderText = searchPlaceholder ?? t('lookup.searchPlaceholder', 'Szukaj...');
    const itemsNoun = itemsLabel ?? t('lookup.items', 'elementów');

    return (
        <div
            className="modal-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1080 }}
            onClick={onClose}
        >
            <div
                className="card shadow-lg"
                style={{
                    width: '95%',
                    maxWidth: 700,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ═══ Header with mode tabs ═══ */}
                <div className="card-header d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h5 className="mb-0 fw-bold">
                        {titleIcon && <i className={`${titleIcon} me-2`} aria-hidden="true" />}
                        {title}
                    </h5>
                    <div className="d-flex align-items-center gap-1">
                        {MODE_CYCLE.map(m => (
                            <button
                                key={m}
                                className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-outline-secondary'}`}
                                style={{ borderRadius: 8, fontSize: 12, padding: '4px 10px' }}
                                onClick={() => setMode(m)}
                                title={`${MODE_LABELS[m]} (LB/RB · Ctrl+←/→)`}
                            >
                                <span className="me-1">{MODE_ICONS[m]}</span>
                                {MODE_LABELS[m]}
                            </button>
                        ))}
                        <button className="btn-close ms-2" onClick={onClose} aria-label={t('common.close', 'Zamknij')} />
                    </div>
                </div>

                {/* ═══ Filter area (mode-dependent) ═══ */}
                <div className="card-body py-2 px-3" style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Mode hint */}
                    <div className="text-muted mb-2" style={{ fontSize: 11 }}>
                        <kbd style={{ fontSize: 10 }}>LB</kbd>/<kbd style={{ fontSize: 10 }}>RB</kbd> {t('lookup.orKey', 'lub')} <kbd style={{ fontSize: 10 }}>Ctrl+←/→</kbd> — {t('lookup.switchMode', 'zmiana trybu')}
                    </div>

                    {/* ─── BASIC MODE ─── */}
                    {mode === "basic" && (
                        <div className="d-flex flex-wrap gap-2 mb-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ maxWidth: 220 }}
                                placeholder={placeholderText}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                            {filters.map(f => (
                                <select
                                    key={f.id}
                                    className="form-select form-select-sm"
                                    style={{ maxWidth: 160 }}
                                    value={filterValues[f.id] ?? ""}
                                    onChange={e => setFilter(f.id, e.target.value)}
                                >
                                    <option value="">{f.allLabel}</option>
                                    {(filterUniqueValues[f.id] ?? []).map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            ))}
                        </div>
                    )}

                    {/* ─── GAMEPAD MODE ─── */}
                    {mode === "gamepad" && (
                        <CarouselNav
                            levels={carouselLevels}
                            onSelect={handleCarouselSelect}
                            onDrillDown={(item) => setCarouselCategory(item.id)}
                            idPrefix={`${idPrefix}carousel-`}
                            visibleCount={4}
                            cardHeight={64}
                            hierarchical
                        />
                    )}

                    {/* ─── ONELINE MODE ─── */}
                    {mode === "oneline" && (
                        <OnelineNav
                            rootOptions={onelineRootOptions}
                            subOptions={onelineSubOptions}
                            category={onelineCategory}
                            value={onelineValue}
                            onCategoryChange={(cat) => {
                                setOnelineCategory(cat);
                                setOnelineValue(null);
                                if (cat === "all" || !cat) clearAllFilters();
                            }}
                            onValueChange={(val) => {
                                setOnelineValue(val);
                                if (onelineCategory && onelineCategory !== "all") {
                                    // Clear other filters, set this one
                                    const newFilters: Record<string, string> = {};
                                    if (val) newFilters[onelineCategory] = val;
                                    setFilterValues(newFilters);
                                }
                            }}
                        />
                    )}

                    {/* Search in gamepad/oneline modes too */}
                    {mode !== "basic" && (
                        <input
                            type="text"
                            className="form-control form-control-sm mt-2"
                            placeholder={placeholderText}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    )}
                </div>

                {/* ═══ Item list ═══ */}
                <div className="card-body p-0" style={{ flex: 1, overflowY: 'auto', minHeight: 200 }}>
                    {isLoading ? (
                        <div className="text-center py-4 text-muted">
                            <i className="fa fa-spinner fa-spin me-2" aria-hidden="true" />
                            {t('lookup.loading', 'Ładowanie...')}
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="fa fa-search me-2" aria-hidden="true" />
                            {t('lookup.noResults', 'Brak wyników spełniających kryteria')}
                        </div>
                    ) : (
                        <div className="d-flex flex-column" role="listbox">
                            <div className="px-3 py-1 text-muted" style={{ fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {filteredItems.length} {itemsNoun}
                            </div>
                            {filteredItems.map((item, idx) => (
                                <MiniItemRow<T>
                                    key={String(getId(item))}
                                    item={item}
                                    index={idx}
                                    onSelect={() => onSelect(item)}
                                    onInfo={onInfo ? () => onInfo(item) : undefined}
                                    getId={getId}
                                    getTitle={getTitle}
                                    getSubtitle={getSubtitle}
                                    getImage={getImage}
                                    getBadges={getBadges}
                                    getExtra={getExtra}
                                    idPrefix={idPrefix}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══ Footer ═══ */}
                <div className="card-footer d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-muted small">
                        {items.length} {itemsNoun} {t('lookup.total', 'łącznie')}
                    </span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                        {t('common.cancel', 'Anuluj')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Typed wrapper so the component can be used as <LookupModal<MyType> ... /> */
const LookupModal = React.memo(LookupModalInner) as typeof LookupModalInner;

/* ═══════════════════════════════════════════════════════════════ */
/*  OnelineNav — single-row hierarchical navigation              */
/* ═══════════════════════════════════════════════════════════════ */

interface OnelineNavProps {
    rootOptions: { id: string; label: string; icon: string }[];
    subOptions: { id: string; label: string }[];
    category: string | null;
    value: string | null;
    onCategoryChange: (cat: string | null) => void;
    onValueChange: (val: string | null) => void;
}

const OnelineNav: React.FC<OnelineNavProps> = ({
    rootOptions, subOptions, category, value, onCategoryChange, onValueChange,
}) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInSub = category !== null && category !== "all";

    const visibleOptions = isInSub && subOptions.length > 0
        ? subOptions
        : rootOptions;

    const currentIdx = useMemo(() => {
        if (isInSub && value) {
            return Math.max(0, subOptions.findIndex(o => o.id === value));
        }
        if (category) {
            return Math.max(0, rootOptions.findIndex(o => o.id === category));
        }
        return 0;
    }, [isInSub, value, category, subOptions, rootOptions]);

    const [activeIdx, setActiveIdx] = useState(currentIdx);
    useEffect(() => { setActiveIdx(currentIdx); }, [currentIdx]);

    const navigateBy = useCallback((delta: number) => {
        setActiveIdx(prev => {
            const len = visibleOptions.length;
            const next = (prev + delta + len) % len;
            const opt = visibleOptions[next];
            if (isInSub) onValueChange(opt.id);
            else onCategoryChange(opt.id);
            return next;
        });
    }, [visibleOptions, isInSub, onCategoryChange, onValueChange]);

    const goBack = useCallback(() => {
        if (isInSub) { onCategoryChange(null); onValueChange(null); }
    }, [isInSub, onCategoryChange, onValueChange]);

    const confirmCurrent = useCallback(() => {
        const opt = visibleOptions[activeIdx];
        if (!opt) return;
        if (!isInSub && opt.id !== "all") onCategoryChange(opt.id);
    }, [visibleOptions, activeIdx, isInSub, onCategoryChange]);

    /* Keyboard */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
            if (e.key === "ArrowLeft") { e.preventDefault(); navigateBy(-1); }
            else if (e.key === "ArrowRight") { e.preventDefault(); navigateBy(1); }
            else if (e.key === "Enter") { e.preventDefault(); confirmCurrent(); }
            else if (e.key === "Backspace" || e.key === "Escape") {
                if (isInSub) { e.preventDefault(); goBack(); }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [navigateBy, confirmCurrent, goBack, isInSub]);

    /* Gamepad D-pad + A/B */
    useEffect(() => {
        let animFrame: number;
        let prevLeft = false, prevRight = false, prevA = false, prevB = false;
        const poll = () => {
            const gp = navigator.getGamepads?.()[0];
            if (gp) {
                const left = gp.buttons[14]?.pressed ?? false;
                const right = gp.buttons[15]?.pressed ?? false;
                const a = gp.buttons[0]?.pressed ?? false;
                const b = gp.buttons[1]?.pressed ?? false;
                if (left && !prevLeft) navigateBy(-1);
                if (right && !prevRight) navigateBy(1);
                if (a && !prevA) confirmCurrent();
                if (b && !prevB) goBack();
                prevLeft = left; prevRight = right; prevA = a; prevB = b;
            }
            animFrame = requestAnimationFrame(poll);
        };
        animFrame = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(animFrame);
    }, [navigateBy, confirmCurrent, goBack]);

    const prevLabel = visibleOptions[(activeIdx - 1 + visibleOptions.length) % visibleOptions.length]?.label ?? '';
    const currentLabel = visibleOptions[activeIdx]?.label ?? '';
    const nextLabel = visibleOptions[(activeIdx + 1) % visibleOptions.length]?.label ?? '';
    const currentIcon = (visibleOptions[activeIdx] as { icon?: string })?.icon;

    return (
        <div ref={containerRef}>
            {isInSub && (
                <div className="mb-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <button
                        className="btn btn-sm p-0 me-1"
                        style={{ fontSize: 11, color: 'var(--nav-active)', background: 'none', border: 'none' }}
                        onClick={goBack}
                    >
                        ← {t('lookup.back', 'Wróć')}
                    </button>
                    · {rootOptions.find(o => o.id === category)?.label}
                </div>
            )}

            <div
                className="d-flex align-items-center justify-content-center gap-2 py-2"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    userSelect: 'none',
                }}
            >
                <button
                    className="btn btn-sm p-0"
                    style={{ fontSize: 18, opacity: 0.4, border: 'none', background: 'none', color: 'var(--text-primary)' }}
                    onClick={() => navigateBy(-1)}
                    aria-label="Previous"
                >◀</button>
                <span className="text-muted" style={{ fontSize: 12, minWidth: 70, textAlign: 'right', opacity: 0.4 }}>
                    {prevLabel}
                </span>

                <div
                    className="d-flex align-items-center justify-content-center gap-2 px-3 py-1 rounded-3"
                    style={{
                        background: 'rgba(13,110,253,0.12)',
                        border: '1px solid rgba(13,110,253,0.3)',
                        minWidth: 130,
                        cursor: 'pointer',
                        transition: 'all .15s',
                    }}
                    onClick={confirmCurrent}
                >
                    {currentIcon && <span style={{ fontSize: 18 }}>{currentIcon}</span>}
                    <span className="fw-semibold" style={{ fontSize: 14 }}>{currentLabel}</span>
                    {!isInSub && visibleOptions[activeIdx]?.id !== "all" && (
                        <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
                    )}
                </div>

                <span className="text-muted" style={{ fontSize: 12, minWidth: 70, textAlign: 'left', opacity: 0.4 }}>
                    {nextLabel}
                </span>
                <button
                    className="btn btn-sm p-0"
                    style={{ fontSize: 18, opacity: 0.4, border: 'none', background: 'none', color: 'var(--text-primary)' }}
                    onClick={() => navigateBy(1)}
                    aria-label="Next"
                >▶</button>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MiniItemRow<T> — generic compact row                         */
/* ═══════════════════════════════════════════════════════════════ */

interface MiniItemRowProps<T> {
    item: T;
    index: number;
    onSelect: () => void;
    onInfo?: () => void;
    getId: (item: T) => string | number;
    getTitle: (item: T) => string;
    getSubtitle: (item: T) => string;
    getImage?: (item: T) => string | undefined;
    getBadges?: (item: T) => { label: string; color: string }[];
    getExtra?: (item: T) => string | undefined;
    idPrefix: string;
}

function MiniItemRowInner<T>({ item, index, onSelect, onInfo, getId, getTitle, getSubtitle, getImage, getBadges, getExtra, idPrefix }: MiniItemRowProps<T>) {
    const { t } = useTranslation();
    const imgSrc = getImage?.(item);
    const badges = getBadges?.(item) ?? [];
    const extra = getExtra?.(item);

    return (
        <Focusable id={`${idPrefix}item-${getId(item)}`}>
            <div
                role="option"
                aria-selected={false}
                tabIndex={0}
                className="d-flex align-items-center gap-2 px-3 py-2"
                style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background .12s',
                }}
                onClick={onSelect}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
                {/* Index */}
                <span style={{ width: 24, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                    {index + 1}
                </span>

                {/* Image */}
                <img
                    src={imgSrc || NO_IMAGE_SVG}
                    alt={getTitle(item)}
                    style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#222' }}
                    loading="lazy"
                />

                {/* Title & Subtitle — left-aligned */}
                <div className="flex-grow-1" style={{ minWidth: 0, textAlign: 'left' }}>
                    <div className="fw-semibold text-truncate" style={{ fontSize: 13 }}>{getTitle(item)}</div>
                    <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{getSubtitle(item)}</div>
                </div>

                {/* Badges + extra */}
                <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                    {badges.map((b, i) => (
                        <span key={i} className="badge" style={{ fontSize: 9, padding: '2px 6px', background: `${b.color}1f`, color: b.color, borderRadius: 4 }}>
                            {b.label}
                        </span>
                    ))}
                    {extra && (
                        <span className="text-muted" style={{ fontSize: 10 }}>{extra}</span>
                    )}
                </div>

                {/* Info button */}
                {onInfo && (
                    <button
                        className="btn btn-sm p-0"
                        style={{ fontSize: 14, opacity: 0.4, border: 'none', background: 'none', color: 'var(--text-primary)', lineHeight: 1 }}
                        onClick={e => { e.stopPropagation(); onInfo(); }}
                        title={t('lookup.info', 'Informacje')}
                    >
                        <i className="fa fa-info-circle" aria-hidden="true" />
                    </button>
                )}

                <i className="fa fa-chevron-right" style={{ fontSize: 10, opacity: 0.3 }} aria-hidden="true" />
            </div>
        </Focusable>
    );
}

const MiniItemRow = React.memo(MiniItemRowInner) as typeof MiniItemRowInner;

export default LookupModal;
