import { useCallback, useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { getEffectiveRules, getBackendOverridesVersion } from "../config/featureVisibility";

/**
 * Hook that exposes an `isFeatureVisible` checker based on the
 * current user's roles, auth status, and admin overrides from
 * SystemConfiguration (backend) with localStorage fallback.
 *
 * Usage:
 *   const { isFeatureVisible } = useFeatureVisibility();
 *   if (isFeatureVisible("music-player")) { … }
 */
export function useFeatureVisibility() {
    const { isAuthenticated, roles, systemConfig } = useUser();

    // Re-compute when backend overrides change (systemConfig reload)
    // or when the in-memory version counter bumps
    const backendVersion = getBackendOverridesVersion();
    const rules = useMemo(
        () => getEffectiveRules(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [systemConfig, backendVersion],
    );

    const isFeatureVisible = useCallback(
        (featureId: string): boolean => {
            const rule = rules.find((r) => r.featureId === featureId);
            // Unknown feature → visible by default
            if (!rule) return true;

            // Feature explicitly hidden via FeatureVisibilityPage
            if (rule.hidden) return false;

            // Auth requirement
            if (rule.requiresAuth && !isAuthenticated) return false;

            // Role restriction (case-insensitive comparison)
            if (rule.visibleToRoles.length > 0) {
                const rolesLower = roles.map((r) => r.toLowerCase());
                const hasRole = rule.visibleToRoles.some((r) => rolesLower.includes(r.toLowerCase()));
                if (!hasRole) return false;
            }

            return true;
        },
        [isAuthenticated, roles, rules],
    );

    return { isFeatureVisible };
}
