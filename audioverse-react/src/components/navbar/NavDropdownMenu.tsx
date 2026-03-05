import React, { useMemo } from "react";
import { NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Focusable } from "../common/Focusable";
import { useTranslation } from "react-i18next";

// ─── Menu item types ──────────────────────────────────────────────

export interface NavMenuLinkItem {
    /** Unique suffix for Focusable id: full id = `${dropdownId}-item-${id}` */
    id: string;
    /** i18n key */
    labelKey: string;
    /** Optional default label if i18n key is missing */
    labelDefault?: string;
    /** Route path */
    to: string;
}

export interface NavMenuActionItem {
    id: string;
    labelKey: string;
    labelDefault?: string;
    onClick: () => void;
    icon?: React.ReactNode;
}

export interface NavMenuDivider {
    type: "divider";
}

export type NavMenuEntry = NavMenuLinkItem | NavMenuActionItem | NavMenuDivider;

function isDivider(entry: NavMenuEntry): entry is NavMenuDivider {
    return "type" in entry && entry.type === "divider";
}

function isAction(entry: NavMenuEntry): entry is NavMenuActionItem {
    return "onClick" in entry;
}

/** Remove leading/trailing/consecutive dividers after filtering */
function cleanDividers(entries: NavMenuEntry[]): NavMenuEntry[] {
    const result: NavMenuEntry[] = [];
    for (const entry of entries) {
        if (isDivider(entry)) {
            // Skip if first item or previous item is already a divider
            if (result.length === 0 || isDivider(result[result.length - 1])) continue;
        }
        result.push(entry);
    }
    // Remove trailing divider
    while (result.length > 0 && isDivider(result[result.length - 1])) {
        result.pop();
    }
    return result;
}

// ─── Props ────────────────────────────────────────────────────────

export interface NavDropdownMenuProps {
    /** Focusable id for the dropdown trigger (e.g., "navbar-music") */
    navId: string;
    /** i18n key for dropdown title */
    titleKey: string;
    /** Bootstrap dropdown id */
    bootstrapId: string;
    /** CSS style on the NavDropdown */
    style?: React.CSSProperties;
    /** Bootstrap align prop (e.g., "end") */
    align?: "start" | "end";
    /** Whether dropdown is currently open */
    isOpen: boolean;
    /** Called when dropped down is toggled */
    onToggle: (open: boolean) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    /** If set, auto-focus first item when opened */
    autoFocusFirstItem?: boolean;
    /** Set active from GamepadNavigationContext */
    setActive?: (id: string) => void;
    /** Menu items */
    items: NavMenuEntry[];
    /**
     * Optional filter predicate applied to non-divider items.
     * Return true to keep the item, false to hide it.
     * Dividers are cleaned up automatically (no leading/trailing/double dividers).
     */
    filterItem?: (item: NavMenuLinkItem | NavMenuActionItem) => boolean;
}

// ─── Component ────────────────────────────────────────────────────

const NavDropdownMenu: React.FC<NavDropdownMenuProps> = ({
    navId,
    titleKey,
    bootstrapId,
    style,
    align,
    isOpen,
    onToggle,
    onMouseEnter,
    onMouseLeave,
    autoFocusFirstItem,
    setActive,
    items,
    filterItem,
}) => {
    const { t } = useTranslation();

    // Apply visibility filter and clean up dividers
    const visibleItems = useMemo(() => {
        if (!filterItem) return items;
        const filtered = items.filter(entry =>
            isDivider(entry) ? true : filterItem(entry as NavMenuLinkItem | NavMenuActionItem),
        );
        return cleanDividers(filtered);
    }, [items, filterItem]);

    const handleToggle = (open: boolean) => {
        onToggle(open);
        if (open && autoFocusFirstItem && setActive) {
            const firstItem = visibleItems.find(e => !isDivider(e)) as NavMenuLinkItem | NavMenuActionItem | undefined;
            if (firstItem) {
                setTimeout(() => setActive(`${navId}-item-${firstItem.id}`), 10);
            }
        }
    };

    const renderItem = (entry: NavMenuEntry, index: number) => {
        if (isDivider(entry)) {
            return <NavDropdown.Divider key={`divider-${index}`} />;
        }

        const fullId = `${navId}-item-${entry.id}`;
        const label = t(entry.labelKey, entry.labelDefault ?? entry.labelKey);

        if (isOpen) {
            // When open: wrap in Focusable for gamepad navigation
            if (isAction(entry)) {
                return (
                    <Focusable id={fullId} key={fullId}>
                        <NavDropdown.Item onClick={entry.onClick}>
                            {entry.icon}{label}
                        </NavDropdown.Item>
                    </Focusable>
                );
            }
            return (
                <Focusable id={fullId} key={fullId}>
                    <NavDropdown.Item as={Link} to={(entry as NavMenuLinkItem).to}>
                        {label}
                    </NavDropdown.Item>
                </Focusable>
            );
        } else {
            // When closed: plain items (no Focusable wrapper)
            if (isAction(entry)) {
                return (
                    <NavDropdown.Item key={`plain-${entry.id}`} onClick={entry.onClick}>
                        {entry.icon}{label}
                    </NavDropdown.Item>
                );
            }
            return (
                <NavDropdown.Item key={`plain-${entry.id}`} as={Link} to={(entry as NavMenuLinkItem).to}>
                    {label}
                </NavDropdown.Item>
            );
        }
    };

    // Hide entire dropdown when all items have been filtered out
    if (visibleItems.length === 0) return null;

    return (
        <Focusable id={navId} isDropdown>
            <NavDropdown
                title={t(titleKey)}
                id={bootstrapId}
                className="nav-drop"
                style={style ?? { color: "var(--nav-text)" }}
                align={align}
                show={isOpen}
                autoClose={false}
                onToggle={handleToggle}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {visibleItems.map(renderItem)}
            </NavDropdown>
        </Focusable>
    );
};

export default React.memo(NavDropdownMenu);
