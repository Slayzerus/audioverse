// WikiSidebar.tsx — Sidebar navigation for the wiki (category tree)
import React, { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useWikiNavQuery } from "../../scripts/api/apiWiki";
import type { WikiNavItemDto } from "../../models/modelsWiki";

// Lucide icon name → Bootstrap icon class mapping (subset)
const iconMap: Record<string, string> = {
  home: "bi-house",
  "file-text": "bi-file-text",
  settings: "bi-gear",
  shield: "bi-shield-lock",
  music: "bi-music-note-beamed",
  gamepad: "bi-controller",
  "bar-chart": "bi-bar-chart",
  globe: "bi-globe",
  folder: "bi-folder",
  zap: "bi-lightning-charge",
  key: "bi-key",
  terminal: "bi-terminal",
  smartphone: "bi-phone",
  palette: "bi-palette",
  navigation: "bi-signpost-split",
  package: "bi-box",
  "check-circle": "bi-check-circle",
  "help-circle": "bi-question-circle",
  code: "bi-code-slash",
  users: "bi-people",
  heart: "bi-heart",
  building: "bi-building",
};

function getIconClass(icon: string | null): string | null {
  if (!icon) return null;
  return iconMap[icon] ?? `bi-${icon}`;
}

function NavItem({ item, activeSlug, depth }: { item: WikiNavItemDto; activeSlug: string; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.slug === activeSlug;
  const iconCls = getIconClass(item.icon);

  return (
    <li className="list-unstyled">
      <div
        className={`d-flex align-items-center py-1 px-2 rounded ${isActive ? "bg-primary bg-opacity-25 fw-semibold" : "text-body"}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren && (
          <button
            className="btn btn-sm btn-link p-0 me-1 text-body"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <i className={`bi ${expanded ? "bi-chevron-down" : "bi-chevron-right"}`} />
          </button>
        )}
        {!hasChildren && <span className="me-1" style={{ width: 16 }} />}
        {iconCls && <i className={`bi ${iconCls} me-1 opacity-50`} style={{ fontSize: "0.85em" }} />}
        <Link to={`/wiki/${item.slug}`} className="text-decoration-none text-body flex-grow-1 small text-truncate">
          {item.title}
        </Link>
      </div>
      {hasChildren && expanded && (
        <ul className="list-unstyled mb-0">
          {item.children!.map(child => (
            <NavItem key={child.id} item={child} activeSlug={activeSlug} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

interface WikiSidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

/** Collapsible category section in sidebar */
function CollapsibleCategory({ category, slug }: { category: { category: string; pages: WikiNavItemDto[] }; slug: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3">
      <button
        className="btn btn-sm btn-link text-decoration-none d-flex align-items-center w-100 p-0 px-2 py-1 text-uppercase text-muted small fw-bold"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`} style={{ fontSize: '0.7em' }} />
        {category.category}
      </button>
      {open && (
        <ul className="list-unstyled mb-0">
          {category.pages.map(page => (
            <NavItem key={page.id} item={page} activeSlug={slug} depth={0} />
          ))}
        </ul>
      )}
    </div>
  );
}

const WikiSidebar: React.FC<WikiSidebarProps> = ({ searchQuery, onSearchChange }) => {
  const { "*": slug = "" } = useParams();
  const { data: navTree, isLoading } = useWikiNavQuery();

  const categories = useMemo(() => navTree ?? [], [navTree]);

  return (
    <aside className="border-end pe-3" style={{ width: 280, minHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
      {/* Search box */}
      <div className="mb-3">
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Search wiki..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search wiki"
        />
      </div>

      {isLoading && <div className="text-muted small">Loading...</div>}

      {categories.map(cat => (
        <CollapsibleCategory key={cat.category} category={cat} slug={slug} />
      ))}
    </aside>
  );
};

export default WikiSidebar;
