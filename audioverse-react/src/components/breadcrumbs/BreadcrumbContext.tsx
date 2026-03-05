/**
 * BreadcrumbContext — Lets individual pages push dynamic breadcrumb overrides
 * at runtime (e.g. replace ":partyId" with the actual party name).
 *
 * Also manages the global "show breadcrumbs" preference.
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { loadUserSettings, syncSettingToBackend } from "../../scripts/settingsSync";

export interface DynamicCrumb {
  /** The labelKey (from the registry) that this overrides */
  targetLabelKey: string;
  /** The dynamic label to display instead */
  label: string;
}

interface BreadcrumbContextType {
  /** Extra / override crumbs pushed by the current page */
  dynamicCrumbs: DynamicCrumb[];
  /** Push a dynamic override – pages call this in useEffect */
  setDynamicCrumbs: (crumbs: DynamicCrumb[]) => void;
  /** Clear dynamic crumbs (called on page unmount) */
  clearDynamicCrumbs: () => void;
  /** Whether breadcrumbs are globally visible */
  breadcrumbsEnabled: boolean;
  /** Toggle the global breadcrumb preference */
  setBreadcrumbsEnabled: (v: boolean) => void;
}

const BreadcrumbCtx = createContext<BreadcrumbContextType>({
  dynamicCrumbs: [],
  setDynamicCrumbs: () => {},
  clearDynamicCrumbs: () => {},
  breadcrumbsEnabled: true,
  setBreadcrumbsEnabled: () => {},
});

const STORAGE_KEY = "av_breadcrumbs_enabled";

function readStoredPref(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "false") return false;
  } catch { /* SSR / privacy */ }
  return true; // default: enabled
}

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dynamicCrumbs, setDynamic] = useState<DynamicCrumb[]>([]);
  const [breadcrumbsEnabled, setBreadcrumbsEnabledState] = useState(readStoredPref);
  const { systemConfig } = useUser();
  const bcSyncDone = useRef(false);

  // Hydrate from backend
  React.useEffect(() => {
    if (bcSyncDone.current) return;
    loadUserSettings().then(s => {
      if (s && typeof s.breadcrumbsEnabled === "boolean") {
        setBreadcrumbsEnabledState(s.breadcrumbsEnabled);
      }
      bcSyncDone.current = true;
    });
  }, []);

  // System-level override: if admin disabled breadcrumbs, respect it
  const effectiveEnabled = breadcrumbsEnabled && (systemConfig?.showBreadcrumbs !== false);

  const setDynamicCrumbs = useCallback((crumbs: DynamicCrumb[]) => setDynamic(crumbs), []);
  const clearDynamicCrumbs = useCallback(() => setDynamic([]), []);

  const setBreadcrumbsEnabled = useCallback((v: boolean) => {
    setBreadcrumbsEnabledState(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* Expected: localStorage may be unavailable (SSR/private browsing) */ }
    syncSettingToBackend({ breadcrumbsEnabled: v });
  }, []);

  const value = useMemo(() => ({
    dynamicCrumbs,
    setDynamicCrumbs,
    clearDynamicCrumbs,
    breadcrumbsEnabled: effectiveEnabled,
    setBreadcrumbsEnabled,
  }), [dynamicCrumbs, setDynamicCrumbs, clearDynamicCrumbs, effectiveEnabled, setBreadcrumbsEnabled]);

  return <BreadcrumbCtx.Provider value={value}>{children}</BreadcrumbCtx.Provider>;
};

/** Hook to access the breadcrumb context */
export const useBreadcrumbs = () => useContext(BreadcrumbCtx);

/**
 * Hook for pages to set dynamic breadcrumb labels.
 * Call with an array of overrides; clears on unmount.
 *
 * @example
 *   useDynamicBreadcrumbs([
 *     { targetLabelKey: "breadcrumb.partyDetail", label: party.name },
 *   ]);
 */
export function useDynamicBreadcrumbs(crumbs: DynamicCrumb[]) {
  const { setDynamicCrumbs, clearDynamicCrumbs } = useBreadcrumbs();
  React.useEffect(() => {
    if (crumbs.length > 0) setDynamicCrumbs(crumbs);
    return () => clearDynamicCrumbs();
    // JSON.stringify provides deep comparison for the crumbs array prop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(crumbs)]);
}
