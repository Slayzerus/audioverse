/**
 * FontAwesomeIconPicker — A searchable dropdown picker for Font Awesome icons.
 * Uses icons loaded via the FA Kit (CDN script in index.html).
 * Renders a text input with a dropdown panel of icon thumbnails.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

// ── Curated icon list (FA 4/5/6 compatible class names) ──
// We ship a static list so there's no runtime dep on @fortawesome internals.
const FA_ICONS: string[] = [
    // People & User
    "fa-user", "fa-user-circle", "fa-user-plus", "fa-user-minus", "fa-user-secret",
    "fa-user-tie", "fa-user-astronaut", "fa-user-ninja", "fa-users", "fa-people-group",
    "fa-person", "fa-child", "fa-baby", "fa-skull", "fa-skull-crossbones",
    // Music & Audio
    "fa-music", "fa-microphone", "fa-microphone-slash", "fa-headphones",
    "fa-guitar", "fa-drum", "fa-compact-disc", "fa-record-vinyl",
    "fa-volume-high", "fa-volume-low", "fa-volume-off", "fa-volume-xmark",
    "fa-radio", "fa-sliders", "fa-podcast",
    // Gaming & Fun
    "fa-gamepad", "fa-chess", "fa-chess-king", "fa-chess-queen", "fa-chess-knight",
    "fa-chess-rook", "fa-chess-pawn", "fa-dice", "fa-dice-d20",
    "fa-puzzle-piece", "fa-ghost", "fa-dragon", "fa-hat-wizard",
    "fa-wand-magic-sparkles", "fa-dungeon",
    // Stars & Awards
    "fa-star", "fa-star-half-stroke", "fa-crown", "fa-trophy", "fa-medal",
    "fa-award", "fa-certificate", "fa-ranking-star", "fa-fire", "fa-fire-flame-curved",
    // Animals
    "fa-dog", "fa-cat", "fa-horse", "fa-fish", "fa-frog", "fa-spider",
    "fa-crow", "fa-dove", "fa-kiwi-bird", "fa-otter", "fa-hippo",
    "fa-dragon", "fa-feather", "fa-paw",
    // Faces & Emoji
    "fa-face-smile", "fa-face-laugh", "fa-face-grin-stars", "fa-face-grin-tongue",
    "fa-face-kiss-wink-heart", "fa-face-angry", "fa-face-dizzy",
    "fa-face-flushed", "fa-face-surprise", "fa-face-meh",
    "fa-face-rolling-eyes", "fa-face-sad-tear", "fa-face-grin-beam",
    // Hearts
    "fa-heart", "fa-heart-crack", "fa-heart-pulse", "fa-hand-holding-heart",
    // Hands & Gestures
    "fa-hand", "fa-hand-peace", "fa-hand-fist", "fa-hand-point-up",
    "fa-hand-point-right", "fa-thumbs-up", "fa-thumbs-down", "fa-hand-spock",
    "fa-hands-clapping", "fa-handshake",
    // Sports
    "fa-futbol", "fa-basketball", "fa-volleyball", "fa-baseball-bat-ball",
    "fa-table-tennis-paddle-ball", "fa-bowling-ball", "fa-golf-ball-tee",
    "fa-dumbbell", "fa-person-running", "fa-person-biking", "fa-person-swimming",
    "fa-person-skiing", "fa-snowboarder", "fa-person-hiking",
    // Nature
    "fa-tree", "fa-leaf", "fa-seedling", "fa-clover", "fa-sun",
    "fa-moon", "fa-cloud", "fa-cloud-sun", "fa-cloud-moon",
    "fa-snowflake", "fa-rainbow", "fa-bolt", "fa-tornado",
    "fa-mountain-sun", "fa-water", "fa-umbrella",
    // Food & Drinks
    "fa-mug-hot", "fa-wine-glass", "fa-beer-mug-empty", "fa-champagne-glasses",
    "fa-martini-glass", "fa-cocktail", "fa-coffee",
    "fa-pizza-slice", "fa-burger", "fa-hotdog", "fa-ice-cream",
    "fa-cookie", "fa-cake-candles", "fa-apple-whole", "fa-lemon", "fa-pepper-hot",
    // Transport
    "fa-car", "fa-car-side", "fa-truck", "fa-motorcycle", "fa-bicycle",
    "fa-plane", "fa-helicopter", "fa-rocket", "fa-shuttle-space",
    "fa-ship", "fa-sailboat", "fa-train", "fa-bus",
    // Objects
    "fa-camera", "fa-camera-retro", "fa-gift", "fa-gem", "fa-ring",
    "fa-key", "fa-lock", "fa-unlock", "fa-bell", "fa-flag",
    "fa-bookmark", "fa-tag", "fa-lightbulb", "fa-bomb", "fa-shield",
    "fa-shield-halved", "fa-skull-crossbones", "fa-crosshairs",
    "fa-binoculars", "fa-compass", "fa-magnifying-glass",
    // Science & Tech
    "fa-flask", "fa-atom", "fa-dna", "fa-microscope", "fa-satellite",
    "fa-robot", "fa-microchip", "fa-laptop", "fa-desktop",
    "fa-mobile-screen", "fa-keyboard", "fa-wifi",
    // Tools
    "fa-wrench", "fa-hammer", "fa-screwdriver-wrench", "fa-gear", "fa-gears",
    "fa-paintbrush", "fa-pen", "fa-pencil", "fa-palette", "fa-scissors",
    // Arrows & Actions
    "fa-arrow-up", "fa-arrow-down", "fa-arrow-left", "fa-arrow-right",
    "fa-rotate", "fa-expand", "fa-compress",
    "fa-circle-check", "fa-circle-xmark", "fa-circle-exclamation",
    "fa-circle-info", "fa-circle-question",
    // Symbols
    "fa-infinity", "fa-hashtag", "fa-at", "fa-copyright", "fa-trademark",
    "fa-peace", "fa-yin-yang", "fa-om", "fa-cross", "fa-ankh",
    // Weather
    "fa-temperature-high", "fa-temperature-low", "fa-wind",
    "fa-cloud-rain", "fa-cloud-bolt", "fa-smog",
    // Miscellaneous
    "fa-wand-magic", "fa-hat-cowboy", "fa-mask", "fa-glasses",
    "fa-earth-americas", "fa-globe", "fa-map", "fa-location-dot",
    "fa-building", "fa-house", "fa-church", "fa-landmark",
    "fa-hospital", "fa-store", "fa-school",
    "fa-anchor", "fa-sailboat", "fa-parachute-box",
    "fa-code", "fa-terminal", "fa-database", "fa-server",
    "fa-plug", "fa-battery-full", "fa-power-off", "fa-recycle",
    "fa-trash", "fa-box", "fa-archive", "fa-folder",
    "fa-file", "fa-image", "fa-film", "fa-video",
    "fa-tv", "fa-radio", "fa-newspaper",
    "fa-book", "fa-book-open", "fa-graduation-cap", "fa-chalkboard",
    "fa-money-bill", "fa-coins", "fa-credit-card", "fa-wallet",
    "fa-chart-line", "fa-chart-bar", "fa-chart-pie",
    "fa-clock", "fa-hourglass", "fa-calendar", "fa-stopwatch",
    "fa-stethoscope", "fa-syringe", "fa-pills", "fa-band-aid",
    "fa-cigarette", "fa-cannabis", "fa-joint",
    "fa-cross", "fa-place-of-worship",
    "fa-bath", "fa-shower", "fa-toilet",
    "fa-utensils", "fa-spoon", "fa-kitchen-set",
    "fa-shirt", "fa-vest", "fa-socks", "fa-shoe-prints",
    "fa-hat-wizard", "fa-hat-cowboy-side",
    // Additional popular
    "fa-magic", "fa-eye", "fa-eye-slash", "fa-cog", "fa-cogs",
    "fa-check", "fa-times", "fa-plus", "fa-minus",
    "fa-exclamation", "fa-question", "fa-info",
    "fa-phone", "fa-envelope", "fa-paper-plane", "fa-comment",
    "fa-comments", "fa-share", "fa-link", "fa-unlink",
    "fa-download", "fa-upload", "fa-cloud-arrow-up", "fa-cloud-arrow-down",
    "fa-print", "fa-copy", "fa-paste", "fa-save",
    "fa-edit", "fa-eraser", "fa-undo", "fa-redo",
];

// Remove duplicates
const UNIQUE_ICONS = [...new Set(FA_ICONS)];

// ── Categories for quick filter ──
const ICON_CATEGORIES: { label: string; icon: string; keywords: string[] }[] = [
    { label: "Ludzie", icon: "fa-user", keywords: ["user", "person", "child", "baby", "people", "skull"] },
    { label: "Muzyka", icon: "fa-music", keywords: ["music", "microphone", "guitar", "drum", "headphone", "volume", "record", "podcast", "radio", "compact", "slider"] },
    { label: "Gry", icon: "fa-gamepad", keywords: ["game", "chess", "dice", "puzzle", "ghost", "dragon", "wizard", "wand", "dungeon"] },
    { label: "Nagrody", icon: "fa-trophy", keywords: ["star", "crown", "trophy", "medal", "award", "certificate", "ranking", "fire"] },
    { label: "Zwierzki", icon: "fa-paw", keywords: ["dog", "cat", "horse", "fish", "frog", "spider", "crow", "dove", "kiwi", "otter", "hippo", "dragon", "feather", "paw"] },
    { label: "Buźki", icon: "fa-face-smile", keywords: ["face", "heart", "hand", "thumb", "shake"] },
    { label: "Sport", icon: "fa-futbol", keywords: ["futbol", "basketball", "volleyball", "baseball", "tennis", "bowling", "golf", "dumbbell", "running", "biking", "swimming", "skiing", "snowboard", "hiking"] },
    { label: "Jedzenie", icon: "fa-utensils", keywords: ["mug", "wine", "beer", "champagne", "martini", "cocktail", "coffee", "pizza", "burger", "hotdog", "ice-cream", "cookie", "cake", "apple", "lemon", "pepper", "utensil", "spoon", "kitchen"] },
    { label: "Natura", icon: "fa-tree", keywords: ["tree", "leaf", "seedling", "clover", "sun", "moon", "cloud", "snow", "rainbow", "bolt", "tornado", "mountain", "water", "umbrella", "wind", "rain", "smog", "temperature"] },
];

interface FontAwesomeIconPickerProps {
    value: string;
    onChange: (icon: string) => void;
    /** Player color for accent */
    playerColor?: string;
}

export default function FontAwesomeIconPicker({ value, onChange, playerColor = "#00aaff" }: FontAwesomeIconPickerProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeCat, setActiveCat] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    // Focus search when opening
    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 100);
    }, [open]);

    const filtered = useMemo(() => {
        let list = UNIQUE_ICONS;
        if (activeCat) {
            const cat = ICON_CATEGORIES.find(c => c.label === activeCat);
            if (cat) {
                list = list.filter(icon => cat.keywords.some(kw => icon.includes(kw)));
            }
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(icon => icon.toLowerCase().includes(q));
        }
        return list;
    }, [search, activeCat]);

    const handleSelect = useCallback((icon: string) => {
        onChange(icon);
        setOpen(false);
        setSearch("");
    }, [onChange]);

    return (
        <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    background: "rgba(255,255,255,0.08)",
                    border: `1px solid ${open ? playerColor : "rgba(255,255,255,0.2)"}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#ddd",
                    fontSize: 13,
                    minWidth: 150,
                    transition: "border-color 0.15s",
                }}
            >
                <span style={{ fontSize: 20, width: 26, textAlign: "center", color: playerColor }}>
                    <i className={`fa ${value || "fa-user"}`} />
                </span>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value || "fa-user"}
                </span>
                <i className={`fa fa-chevron-${open ? "up" : "down"}`} style={{ fontSize: 10, opacity: 0.5 }} />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 4,
                    width: 360,
                    maxHeight: 420,
                    background: "#1e1e24",
                    border: `1px solid ${playerColor}44`,
                    borderRadius: 10,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${playerColor}22`,
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}>
                    {/* Search bar */}
                    <div style={{ padding: "8px 10px", borderBottom: "1px solid #333" }}>
                        <div style={{ position: "relative" }}>
                            <i className="fa fa-search" style={{
                                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                                color: "#666", fontSize: 12,
                            }} />
                            <Form.Control
                                ref={searchRef}
                                type="text"
                                placeholder={t("iconPicker.searchPlaceholder", "Search icons...")}
                                value={search}
                                onChange={e => { setSearch(e.target.value); setActiveCat(null); }}
                                style={{
                                    background: "#2a2a30",
                                    border: "1px solid #444",
                                    color: "#eee",
                                    fontSize: 12,
                                    paddingLeft: 32,
                                    borderRadius: 6,
                                }}
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* Category pills */}
                    <div style={{
                        padding: "6px 10px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 3,
                        borderBottom: "1px solid #333",
                    }}>
                        <button
                            type="button"
                            onClick={() => setActiveCat(null)}
                            style={{
                                padding: "2px 8px",
                                borderRadius: 10,
                                border: `1px solid ${!activeCat ? playerColor : "#444"}`,
                                background: !activeCat ? `${playerColor}33` : "transparent",
                                color: !activeCat ? "#fff" : "#aaa",
                                cursor: "pointer",
                                fontSize: 10,
                                fontWeight: 600,
                            }}
                        >
                            Wszystkie
                        </button>
                        {ICON_CATEGORIES.map(cat => (
                            <button
                                key={cat.label}
                                type="button"
                                onClick={() => setActiveCat(activeCat === cat.label ? null : cat.label)}
                                style={{
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                    border: `1px solid ${activeCat === cat.label ? playerColor : "#444"}`,
                                    background: activeCat === cat.label ? `${playerColor}33` : "transparent",
                                    color: activeCat === cat.label ? "#fff" : "#aaa",
                                    cursor: "pointer",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                }}
                            >
                                <i className={`fa ${cat.icon}`} style={{ fontSize: 10 }} />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Icon grid */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: 8,
                        display: "grid",
                        gridTemplateColumns: "repeat(8, 1fr)",
                        gap: 3,
                        alignContent: "start",
                    }}>
                        {filtered.length === 0 && (
                            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", padding: 20, fontSize: 12 }}>
                                Brak ikon pasujących do "{search}"
                            </div>
                        )}
                        {filtered.map(icon => {
                            const selected = value === icon;
                            return (
                                <button
                                    key={icon}
                                    type="button"
                                    title={icon}
                                    onClick={() => handleSelect(icon)}
                                    style={{
                                        width: "100%",
                                        aspectRatio: "1 / 1",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: selected ? `2px solid ${playerColor}` : "1px solid transparent",
                                        borderRadius: 6,
                                        background: selected ? `${playerColor}33` : "transparent",
                                        color: selected ? playerColor : "#ccc",
                                        cursor: "pointer",
                                        fontSize: 18,
                                        transition: "all 0.1s",
                                        padding: 0,
                                    }}
                                    onMouseEnter={e => {
                                        if (!selected) {
                                            (e.target as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!selected) {
                                            (e.target as HTMLElement).style.background = "transparent";
                                        }
                                    }}
                                >
                                    <i className={`fa ${icon}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer - selected icon name */}
                    <div style={{
                        padding: "6px 10px",
                        borderTop: "1px solid #333",
                        fontSize: 11,
                        color: "#888",
                        display: "flex",
                        justifyContent: "space-between",
                    }}>
                        <span>{filtered.length} ikon</span>
                        <span style={{ color: playerColor, fontWeight: 600 }}>{value || "fa-user"}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
