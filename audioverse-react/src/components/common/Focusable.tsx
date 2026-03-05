import React, { useEffect } from "react";
import { useGamepadNavigation } from "../../contexts/GamepadNavigationContext";
import { useFocusableLayout } from "./useFocusableLayout";
import { navigationLogger } from "../../services/navigationLogger";

export type FocusHighlightMode = 'outline' | 'dim' | 'brighten' | 'glow' | 'scale';

interface FocusableProps {
  id: string;
  isDropdown?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  role?: React.AriaRole;
  /** Highlight mode when focused. Default: 'outline' (current behavior) */
  highlightMode?: FocusHighlightMode;
}

const HIGHLIGHT_CLASS_MAP: Record<FocusHighlightMode, string> = {
  outline: 'focusable-active',
  dim: 'focusable-active-dim',
  brighten: 'focusable-active-brighten',
  glow: 'focusable-active-glow',
  scale: 'focusable-active-scale',
};

export const Focusable: React.FC<FocusableProps> = ({ id, isDropdown, children, className, style, ariaLabel, role, highlightMode = 'outline' }) => {
  const { ref, layout } = useFocusableLayout<HTMLDivElement>();
  const { register, unregister, activeId } = useGamepadNavigation();

  useEffect(() => {
    if (!ref.current) {
      navigationLogger.error("FOCUSABLE_REF_NULL_ON_MOUNT", { id, page: window.location.pathname });
      return;
    }

    try {
      register({ id, ref, ...layout, isDropdown });
      navigationLogger.debug("FOCUSABLE_REGISTERED", {
        id,
        position: { x: layout.x, y: layout.y },
        size: { width: layout.width, height: layout.height }
      });
    } catch (error) {
      navigationLogger.error("FOCUSABLE_REGISTRATION_FAILED", { id, message: (error as Error).message });
    }

    return () => {
      try {
        unregister(id);
        navigationLogger.debug("FOCUSABLE_UNREGISTERED", { id });
      } catch (error) {
        navigationLogger.error("FOCUSABLE_UNREGISTRATION_FAILED", { id, message: (error as Error).message });
      }
    };
  }, [id, layout.x, layout.y, layout.width, layout.height, isDropdown, register, unregister]);

  const isActive = activeId === id;
  const activeClass = isActive ? ` ${HIGHLIGHT_CLASS_MAP[highlightMode]}` : '';

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={`${className ?? ""}${activeClass}`.trim()}
      style={{ outline: 'none', ...style }}
      aria-label={ariaLabel ?? id}
      role={role ?? "group"}
    >
      {children}
    </div>
  );
};
