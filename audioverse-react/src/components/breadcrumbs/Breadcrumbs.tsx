/**
 * Breadcrumbs.tsx — Bootstrap 5 breadcrumb bar rendered from the registry.
 *
 * Resolves the current pathname against the breadcrumb registry, applies
 * dynamic overrides from BreadcrumbContext, and respects the global
 * breadcrumbsEnabled flag (admin-configurable + localStorage).
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resolveBreadcrumbs } from "./breadcrumbRegistry";
import { useBreadcrumbs } from "./BreadcrumbContext";

const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { breadcrumbsEnabled, dynamicCrumbs } = useBreadcrumbs();

  if (!breadcrumbsEnabled) return null;

  const resolved = resolveBreadcrumbs(pathname, t);
  if (!resolved || resolved.length === 0) return null;

  // Apply dynamic overrides
  const crumbs = resolved.map(c => {
    const dyn = dynamicCrumbs.find(d => d.targetLabelKey === c.labelKey);
    return dyn ? { ...c, label: dyn.label } : c;
  });

  return (
    <nav
      aria-label="breadcrumb"
      className="av-breadcrumbs karaoke-breadcrumb"
      style={{
        padding: "6px 16px",
        fontSize: "0.82rem",
        background: "transparent",
      }}
    >
      <ol className="breadcrumb mb-0" style={{ flexWrap: "nowrap", overflow: "auto" }}>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li
              key={c.path + i}
              className={`breadcrumb-item${isLast ? " active" : ""}`}
              aria-current={isLast ? "page" : undefined}
              style={{
                whiteSpace: "nowrap",
                ...(isLast
                  ? { fontStyle: "italic", color: "var(--text-primary)" }
                  : {}),
              }}
            >
              {isLast ? (
                c.label
              ) : (
                <Link
                  to={c.path}
                  className="text-decoration-none"
                  style={{ color: "var(--nav-active)" }}
                >
                  {i === 0 && <i className="bi bi-house-door me-1" />}
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
