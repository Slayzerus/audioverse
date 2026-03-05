import React, { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { GamepadMapping, loadGamepadMapping } from "../utils/gamepadMapping";
import { navigationLogger } from "../services/navigationLogger";

export interface FocusableMeta {
  id: string;
  ref: React.RefObject<HTMLElement>;
  x: number;
  y: number;
  width: number;
  height: number;
  isDropdown?: boolean;
}

interface GamepadNavigationContextType {
  register: (meta: FocusableMeta) => void;
  unregister: (id: string) => void;
  moveFocus: (dx: number, dy: number) => void;
  setActive: (id: string) => void;
  activeId: string | null;
  focusables: FocusableMeta[];
  pushFocusTrap: (prefix: string, onDismiss?: () => void) => void;
  popFocusTrap: () => void;
  /** Increment game-mode lock counter — while > 0 all navigation input is suppressed. */
  enterGameMode: () => void;
  /** Decrement game-mode lock counter. */
  exitGameMode: () => void;
}

const GamepadNavigationContext = createContext<GamepadNavigationContextType | undefined>(undefined);

export const GamepadNavigationProvider = ({ children }: { children: ReactNode }) => {
  const [focusables, setFocusables] = useState<FocusableMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapping, setMapping] = useState<GamepadMapping>(() => loadGamepadMapping());
  const [activePadIndex, setActivePadIndex] = useState<number>(0);

  // Refs used inside long-lived handlers to avoid re-attaching listeners.
  const focusablesRef = useRef<FocusableMeta[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const mappingRef = useRef<GamepadMapping>(mapping);
  const activePadIndexRef = useRef<number>(0);

  // Focus trap stack: restrict navigation to elements matching a prefix
  const focusTrapStackRef = useRef<{ prefix: string; onDismiss?: () => void }[]>([]);

  // Game-mode lock: counter-based ref. While > 0, ALL keyboard/gamepad navigation is suppressed.
  const gameModeLockRef = useRef<number>(0);

  const enterGameMode = () => { gameModeLockRef.current += 1; };
  const exitGameMode = () => { gameModeLockRef.current = Math.max(0, gameModeLockRef.current - 1); };

  /**
   * Auto-detect whether a game is actively running.
   * Returns true if:
   *  - explicit game-mode lock is active, OR
   *  - pointer lock is engaged (FPS-style games), OR
   *  - we're on a game route AND a <canvas> is rendered on the page
   */
  const isGameActive = (): boolean => {
    if (gameModeLockRef.current > 0) return true;
    if (document.pointerLockElement) return true;
    const path = window.location.pathname;
    const isGameRoute = path.startsWith('/mini-games/') || path.startsWith('/honest-living/');
    if (isGameRoute && document.querySelector('canvas')) return true;
    return false;
  };

  const pushFocusTrap = (prefix: string, onDismiss?: () => void) => {
    focusTrapStackRef.current = [...focusTrapStackRef.current, { prefix, onDismiss }];
  };

  const popFocusTrap = () => {
    const stack = focusTrapStackRef.current;
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    focusTrapStackRef.current = stack.slice(0, -1);
    top.onDismiss?.();
  };

  useEffect(() => { focusablesRef.current = focusables; }, [focusables]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { mappingRef.current = mapping; }, [mapping]);
  useEffect(() => { activePadIndexRef.current = activePadIndex; }, [activePadIndex]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<GamepadMapping>).detail;
      setMapping(detail ?? loadGamepadMapping());
    };
    window.addEventListener("gamepadMappingChanged", handler as EventListener);
    return () => window.removeEventListener("gamepadMappingChanged", handler as EventListener);
  }, []);

  // Register/unregister focusable elements
  const register = useCallback((meta: FocusableMeta) => {
    const existing = focusablesRef.current.find(f => f.id === meta.id);
    if (existing) {
      navigationLogger.warn("DUPLICATE_ID", { id: meta.id });
      return;
    }

    if (!Number.isFinite(meta.x) || !Number.isFinite(meta.y)) {
      navigationLogger.error("NAN_COORDINATES", { id: meta.id, x: meta.x, y: meta.y });
      return;
    }

    if (meta.width <= 0 || meta.height <= 0) {
      navigationLogger.warn("INVALID_DIMENSIONS", { id: meta.id, width: meta.width, height: meta.height });
    }

    setFocusables(prev => {
      if (prev.some(f => f.id === meta.id)) return prev;
      return [...prev, meta];
    });

    navigationLogger.debug("FOCUSABLE_REGISTERED", {
      id: meta.id,
      position: { x: meta.x, y: meta.y },
      size: { width: meta.width, height: meta.height }
    });
  }, []);
  const unregister = useCallback((id: string) => {
    const wasActive = activeIdRef.current === id;

    setFocusables(prev => {
      const filtered = prev.filter(f => f.id !== id);

      if (wasActive && filtered.length > 0) {
        // If removed element is dropdown-item, focus returns to parent dropdown
        const dropdownParent = id.includes('-item-') ? id.split('-item-')[0] : null;
        const fallbackId = dropdownParent && filtered.some(f => f.id === dropdownParent)
          ? dropdownParent
          : filtered[0].id;
        navigationLogger.warn("ACTIVE_ELEMENT_REMOVED", {
          removedId: id,
          redirectingTo: fallbackId,
          page: window.location.pathname
        });
        setActiveId(fallbackId);
        activeIdRef.current = fallbackId;
        const fallbackMeta = filtered.find(f => f.id === fallbackId);
        fallbackMeta?.ref.current?.focus();
      } else if (wasActive && filtered.length === 0) {
        navigationLogger.error("ACTIVE_ELEMENT_REMOVED_NO_FALLBACK", { removedId: id, page: window.location.pathname });
        setActiveId(null);
        activeIdRef.current = null;
      }

      return filtered;
    });

    navigationLogger.debug("FOCUSABLE_UNREGISTERED", { id });
  }, []);

  // Move focus in spatial direction
  const moveFocus = (dx: number, dy: number) => {
    const start = performance.now();
    const currentActiveId = activeIdRef.current;
    const list = focusablesRef.current;
    // Focus trap prevention: if no active element and there are focusables, activate first
    if (!currentActiveId && list.length > 0) {
      const first = list[0];
      setActiveId(first.id);
      activeIdRef.current = first.id;
      first.ref.current?.focus();
      return;
    }
    if (!currentActiveId || list.length === 0) {
      if (list.length === 0) {
        navigationLogger.warn("NO_FOCUSABLE_ELEMENTS", { direction: [dx, dy], page: window.location.pathname });
      }
      return;
    }
    const current = list.find(f => f.id === currentActiveId);
    if (!current) {
      navigationLogger.error("ACTIVE_ELEMENT_NOT_FOUND", {
        currentActiveId,
        focusableCount: list.length,
        focusableIds: list.map(f => f.id)
      });
      return;
    }

    // Focus trapping: if inside a dropdown (item), restrict navigation to siblings
    const trapStack = focusTrapStackRef.current;
    const activeTrapPrefix = trapStack.length > 0 ? trapStack[trapStack.length - 1].prefix : null;

    const dropdownPrefix = current.id.includes('-item-')
      ? current.id.split('-item-')[0]
      : null;

    // Build candidate list (focus trap > dropdown trap > all)
    const candidates = activeTrapPrefix
      ? list.filter(f => f.id !== current.id && f.id.startsWith(activeTrapPrefix))
      : dropdownPrefix
      ? list.filter(f => f.id !== current.id && f.id.startsWith(dropdownPrefix + '-item-'))
      : list.filter(f => f.id !== current.id);

    // Find the closest element in the direction (dx, dy)
    let best: FocusableMeta | null = null;
    let bestScore = Infinity;
    for (const f of candidates) {
      const cx = f.x + f.width / 2;
      const cy = f.y + f.height / 2;
      const ccx = current.x + current.width / 2;
      const ccy = current.y + current.height / 2;
      const vx = cx - ccx;
      const vy = cy - ccy;
      // Only consider elements in the intended direction
      if ((dx !== 0 && Math.sign(vx) !== Math.sign(dx)) || (dy !== 0 && Math.sign(vy) !== Math.sign(dy))) continue;
      // Score: angle alignment + distance
      const angle = Math.atan2(vy, vx) - Math.atan2(dy, dx);
      const angleScore = Math.abs(angle);
      const dist = Math.sqrt(vx * vx + vy * vy);
      const score = angleScore * 2 + dist;
      if (score < bestScore) {
        best = f;
        bestScore = score;
      }
    }
    if (best) {
      setActiveId(best.id);
      activeIdRef.current = best.id;
      try {
        best.ref.current?.focus();
        best.ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        // (log removed)
      } catch (error) {
        navigationLogger.error("FOCUS_APPLICATION_FAILED", { elementId: best.id, message: (error as Error).message });
      }
      const distance = Math.sqrt(Math.pow(best.x - current.x, 2) + Math.pow(best.y - current.y, 2));
      if (distance > window.innerWidth) {
        navigationLogger.debug("LARGE_FOCUS_JUMP", {
          from: current.id,
          to: best.id,
          distance,
          viewportWidth: window.innerWidth
        });
      }
    } else {
      // Edge wrapping: find farthest in direction (within candidates only = same dropdown scope)
      let farthest: FocusableMeta | null = null;
      let farScore = -Infinity;
      for (const f of candidates) {
        const cx = f.x + f.width / 2;
        const cy = f.y + f.height / 2;
        const ccx = current.x + current.width / 2;
        const ccy = current.y + current.height / 2;
        const vx = cx - ccx;
        const vy = cy - ccy;
        if ((dx !== 0 && Math.sign(vx) !== Math.sign(dx)) || (dy !== 0 && Math.sign(vy) !== Math.sign(dy))) continue;
        const dist = Math.sqrt(vx * vx + vy * vy);
        if (dist > farScore) {
          farthest = f;
          farScore = dist;
        }
      }
      if (farthest) {
        setActiveId(farthest.id);
        activeIdRef.current = farthest.id;
        farthest.ref.current?.focus();
        farthest.ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        // (log removed)
      } else {
        navigationLogger.debug("NO_ADJACENT_ELEMENT", {
          currentId: current.id,
          direction: [dx, dy],
          elementCount: list.length,
          currentPos: { x: current.x, y: current.y }
        });
      }
    }

    const duration = performance.now() - start;
    if (duration > 50) {
      navigationLogger.warn("SLOW_FOCUS_MOVE", {
        duration,
        elementCount: list.length,
        page: window.location.pathname
      });
    }
  };

  // Set active element
  const setActive = (id: string) => {
    setActiveId(id);
    activeIdRef.current = id;
    const meta = focusables.find(f => f.id === id);
    if (meta) {
      // (log removed)
      meta.ref.current?.focus();
    }
  };

  // ── Helper: cycle through top-level navbar items (LT/RT) ──
  const cycleNavbar = (direction: 1 | -1) => {
    const navbarOrder = ['navbar-music', 'navbar-games', 'navbar-create', 'navbar-social', 'navbar-admin', 'navbar-profile', 'navbar-settings'];
    const currentId = activeIdRef.current || '';
    let currentNavIdx = navbarOrder.findIndex(id => currentId === id || currentId.startsWith(id + '-item-'));
    if (currentNavIdx < 0) currentNavIdx = direction > 0 ? -1 : navbarOrder.length;
    let nextIdx = currentNavIdx + direction;
    if (nextIdx < 0) nextIdx = navbarOrder.length - 1;
    if (nextIdx >= navbarOrder.length) nextIdx = 0;
    // Skip non-existing items (filtered by feature visibility)
    for (let tries = 0; tries < navbarOrder.length; tries++) {
      const targetId = navbarOrder[nextIdx];
      if (focusablesRef.current.some(f => f.id === targetId)) {
        setActiveId(targetId);
        activeIdRef.current = targetId;
        const meta = focusablesRef.current.find(f => f.id === targetId);
        meta?.ref.current?.focus();
        return;
      }
      nextIdx += direction;
      if (nextIdx < 0) nextIdx = navbarOrder.length - 1;
      if (nextIdx >= navbarOrder.length) nextIdx = 0;
    }
  };

  // ── Helper: cycle party tabs (LB/RB) ──
  const cyclePartyTab = (direction: 1 | -1) => {
    window.dispatchEvent(new CustomEvent('party-tab-cycle', { detail: { direction } }));
  };

  // Gamepad event handling (global)
  useEffect(() => {
    let lastMove = 0;
    let lastConfirm = 0;
    let lastBumper = 0;
    let lastTrigger = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    let lastPadCount = 0;

    const applyDeadzone = (v: number) => (Math.abs(v) < mappingRef.current.deadzone ? 0 : v);

    const handleGamepad = () => {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      if (pads.length === 0) {
        if (lastPadCount > 0) {
          navigationLogger.debug("GAMEPADS_DISCONNECTED", { previousCount: lastPadCount });
        }
        lastPadCount = 0;
        return;
      }
      if (pads.length !== lastPadCount) {
        navigationLogger.debug("GAMEPAD_COUNT_CHANGED", { previous: lastPadCount, current: pads.length });
        lastPadCount = pads.length;
      }
      if (pads.length > 1) {
        navigationLogger.debug("MULTIPLE_GAMEPADS_CONNECTED", {
          count: pads.length,
          activePadIndex: activePadIndexRef.current,
          padIds: pads.map((p, i) => ({ index: i, id: p?.id }))
        });
      }
      // Prefer currently active pad; auto-switch to the pad that sends any input
      let pad = pads[activePadIndexRef.current] ?? pads[0];
      if (!pad) return;

      // If another pad has any pressed button, switch active pad
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        if (!p) continue;
        const anyPressed = p.buttons?.some(b => b?.pressed);
        if (anyPressed && i !== activePadIndexRef.current) {
          setActivePadIndex(i);
          activePadIndexRef.current = i;
          pad = p;
          break;
        }
      }

      const path = window.location.pathname;
      const isOnGameRoute = path.startsWith('/mini-games/') || path.startsWith('/honest-living/');

      // On game routes, suppress ALL navigation (d-pad, confirm, cancel).
      // Games/lobbies handle their own input through useGamepads/useGamepadEdges.
      if (isOnGameRoute || isGameActive()) {
        // Even on game routes, allow LT/RT for navbar and LB/RB for tab cycling
        // (only when not actually in-game — just on the lobby/settings)
        if (!isGameActive()) {
          const now = Date.now();
          // LB (button 4) / RB (button 5) — party tab cycling
          if (pad.buttons[4]?.pressed && now - lastBumper > 300) {
            lastBumper = now;
            cyclePartyTab(-1);
          }
          if (pad.buttons[5]?.pressed && now - lastBumper > 300) {
            lastBumper = now;
            cyclePartyTab(1);
          }
          // LT (button 6) / RT (button 7) — navbar cycling
          if (pad.buttons[6]?.pressed && now - lastTrigger > 300) {
            lastTrigger = now;
            cycleNavbar(-1);
          }
          if (pad.buttons[7]?.pressed && now - lastTrigger > 300) {
            lastTrigger = now;
            cycleNavbar(1);
          }
        }
        return;
      }

      // D-pad or left stick
      const threshold = 0.5;
      let dx = 0, dy = 0;
      const ax0 = applyDeadzone(pad.axes[0] ?? 0);
      const ax1 = applyDeadzone(pad.axes[1] ?? 0);
      if (ax0 < -threshold) dx = -1;
      if (ax0 > threshold) dx = 1;
      if (ax1 < -threshold) dy = -1;
      if (ax1 > threshold) dy = 1;
      // D-pad buttons
      if (pad.buttons[14]?.pressed) dx = -1;
      if (pad.buttons[15]?.pressed) dx = 1;
      if (pad.buttons[12]?.pressed) dy = -1;
      if (pad.buttons[13]?.pressed) dy = 1;
      // Only move if direction changed
      // Cooldown only in menu (not in game)
      const isMenu = (
        path === "/" ||
        path.startsWith("/party") && !path.includes("Round") ||
        path.startsWith("/explore") ||
        path.startsWith("/settings") ||
        path === "/register" ||
        path === "/login" ||
        path.includes("SongBrowser")
      );
      if (dx !== 0 || dy !== 0) {
        if (isMenu) {
          if (Date.now() - lastMove > 200) {
            moveFocus(dx, dy);
            lastMove = Date.now();
          }
        } else {
          moveFocus(dx, dy);
        }
      }

      const now = Date.now();

      // LB (button 4) / RB (button 5) — party tab cycling
      if (pad.buttons[4]?.pressed && now - lastBumper > 300) {
        lastBumper = now;
        cyclePartyTab(-1);
      }
      if (pad.buttons[5]?.pressed && now - lastBumper > 300) {
        lastBumper = now;
        cyclePartyTab(1);
      }
      // LT (button 6) / RT (button 7) — navbar cycling
      if (pad.buttons[6]?.pressed && now - lastTrigger > 300) {
        lastTrigger = now;
        cycleNavbar(-1);
      }
      if (pad.buttons[7]?.pressed && now - lastTrigger > 300) {
        lastTrigger = now;
        cycleNavbar(1);
      }

      // Back / Cancel button (B = button 1) — close dropdown, dismiss focus trap, or go back
      const cancelIndex = mappingRef.current.backButton ?? 1;
      if (pad.buttons[cancelIndex]?.pressed && activeIdRef.current) {
        if (now - lastConfirm > 300) {
          lastConfirm = now;
          // If inside a dropdown item, close dropdown and return to trigger
          const currentId = activeIdRef.current;
          if (currentId.includes('-item-')) {
            const triggerPrefix = currentId.split('-item-')[0];
            const trigger = focusablesRef.current.find(f => f.id === triggerPrefix);
            if (trigger) {
              // Signal dropdown close
              const closeEvt = new CustomEvent('navbar-close-dropdown', { detail: { id: triggerPrefix } });
              window.dispatchEvent(closeEvt);
              setActiveId(triggerPrefix);
              activeIdRef.current = triggerPrefix;
              trigger.ref.current?.focus();
            }
          } else if (focusTrapStackRef.current.length > 0) {
            popFocusTrap();
          } else {
            window.history.back();
          }
        }
      }
      // Confirm (mapped button)
      const confirmIndex = mappingRef.current.confirmButton ?? 0;
      if (pad.buttons[confirmIndex]?.pressed && activeIdRef.current) {
        if (now - lastConfirm < 300) return;
        lastConfirm = now;
        const meta = focusablesRef.current.find(f => f.id === activeIdRef.current);
        if (meta?.ref.current) {
          // If this is a navbar dropdown:
          if (meta.isDropdown) {
            // If dropdown is closed, open it (as before)
            const event = new CustomEvent("navbar-toggle-dropdown", { detail: { id: meta.id } });
            window.dispatchEvent(event);
            // If dropdown already open, try entering the first focusable child
            // (i.e. Focusable with id starting with `${meta.id}-item-`)
            // Check if such a Focusable exists and focus it
            setTimeout(() => {
              const childMeta = focusablesRef.current.find(f => f.id.startsWith(`${meta.id}-item-`));
              if (childMeta && childMeta.ref.current) {
                childMeta.ref.current.focus();
                setActiveId(childMeta.id);
                activeIdRef.current = childMeta.id;
              }
            }, 10);
            return;
          }

          // If this is a dropdown item (e.g., "navbar-music-item-karaoke"),
          // click it (to navigate), close the parent dropdown, and focus first body focusable.
          const currentId = activeIdRef.current ?? "";
          if (currentId.includes('-item-')) {
            const triggerPrefix = currentId.split('-item-')[0];
            // Click the anchor/button in the item to trigger navigation
            const anchor = meta.ref.current.querySelector('a') as HTMLElement | null;
            const button = meta.ref.current.querySelector('button') as HTMLElement | null;
            if (anchor) anchor.click();
            else if (button) button.click();
            else meta.ref.current.click?.();

            // IMMEDIATELY clear activeId so the auto-close effect in
            // useNavbarDropdowns sees a non-dropdown activeId and closes
            // the dropdown on the next React render.
            setActiveId("");
            activeIdRef.current = "";

            // Also explicitly signal dropdown close (belt-and-suspenders)
            const closeEvt = new CustomEvent('navbar-close-dropdown', { detail: { id: triggerPrefix } });
            window.dispatchEvent(closeEvt);

            // Remove focus from the dropdown item
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }

            // After the new page renders, focus the first non-navbar body focusable
            setTimeout(() => {
              const bodyFocusable = focusablesRef.current.find(f => !f.id.startsWith('navbar-'));
              if (bodyFocusable?.ref.current) {
                bodyFocusable.ref.current.focus();
                setActiveId(bodyFocusable.id);
                activeIdRef.current = bodyFocusable.id;
              }
            }, 200);
            return;
          }

          // If it's a container, try entering the first focusable child
          const childFocusable = meta.ref.current.querySelector('[tabindex="0"]');
          if (childFocusable && childFocusable !== meta.ref.current) {
            (childFocusable as HTMLElement).focus();
            const childMeta = focusablesRef.current.find(f => f.ref.current === childFocusable);
            if (childMeta) {
              setActiveId(childMeta.id);
              activeIdRef.current = childMeta.id;
            }
          } else {
            // Search first for button[type=submit], then any button, input[type=submit], a, then click wrapper
            const submitBtn = meta.ref.current.querySelector('button[type="submit"],input[type="submit"]') as HTMLElement | null;
            const button = meta.ref.current.querySelector('button') as HTMLElement | null;
            const anchor = meta.ref.current.querySelector('a') as HTMLElement | null;
            if (submitBtn) {
              submitBtn.click();
            } else if (button) {
              button.click();
            } else if (anchor) {
              anchor.click();
            } else {
              // Try to activate <select> or <input> inside the focusable wrapper
              const selectEl = meta.ref.current.querySelector('select') as HTMLSelectElement | null;
              const inputEl = meta.ref.current.querySelector('input') as HTMLInputElement | null;
              if (selectEl) {
                selectEl.focus();
                selectEl.showPicker?.();
              } else if (inputEl) {
                inputEl.focus();
              } else {
                meta.ref.current.click?.();
              }
            }
          }
        }
      }


    };

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(handleGamepad, 50);
    };

    const stopPollingIfNoPads = () => {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      if (pads.length === 0 && interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onConnected = () => startPolling();
    const onDisconnected = () => stopPollingIfNoPads();

    // Start immediately if pads are already connected
    startPolling();

    window.addEventListener("gamepadconnected", onConnected);
    window.addEventListener("gamepaddisconnected", onDisconnected);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("gamepadconnected", onConnected);
      window.removeEventListener("gamepaddisconnected", onDisconnected);
    };
  }, []);

  // Keyboard arrows mirror gamepad navigation; Enter/Space activates; ESC goes back
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const inFormElement = tag && ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

      const path = window.location.pathname;
      const isOnGameRoute = path.startsWith('/mini-games/') || path.startsWith('/honest-living/');

      // While a game is active, suppress ALL navigation keys including Escape.
      // Games should provide their own exit mechanism (pause menu, exit button).
      if (isGameActive()) return;

      // On game routes (lobby/settings phase — not yet in-game),
      // let the game components handle all keys except Shift/Ctrl+Arrows for nav.
      if (isOnGameRoute) {
        // Shift+Left/Right → cycle navbar items
        if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          e.preventDefault();
          cycleNavbar(e.key === "ArrowLeft" ? -1 : 1);
          return;
        }
        // Ctrl+Left/Right → cycle party tabs
        if (e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          e.preventDefault();
          cyclePartyTab(e.key === "ArrowLeft" ? -1 : 1);
          return;
        }
        // Let game route components (PlayerLobby) handle everything else
        return;
      }

      // ESC: dismiss focus trap or navigate back (only when NOT on game routes)
      if (e.key === "Escape") {
        e.preventDefault();
        if (focusTrapStackRef.current.length > 0) {
          popFocusTrap();
        } else {
          window.history.back();
        }
        return;
      }

      // Skip custom navigation when in form elements (allow native Tab/Shift+Tab)
      if (inFormElement) return;

      // Don't override native Tab cycling
      if (e.key === "Tab") return;

      // Shift+Left/Right → cycle navbar items
      if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        cycleNavbar(e.key === "ArrowLeft" ? -1 : 1);
        return;
      }

      // Ctrl+Left/Right → cycle party tabs
      if (e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        cyclePartyTab(e.key === "ArrowLeft" ? -1 : 1);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveFocus(-1, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveFocus(1, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(0, -1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(0, 1);
      } else if ((e.key === "Enter" || e.key === " ") && activeIdRef.current) {
        e.preventDefault();
        const meta = focusablesRef.current.find(f => f.id === activeIdRef.current);
        if (meta?.isDropdown && meta.ref.current) {
          (meta.ref.current as HTMLSelectElement).click();
        } else if (meta?.ref.current) {
          meta.ref.current.click?.();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <GamepadNavigationContext.Provider value={{ register, unregister, moveFocus, setActive, activeId, focusables, pushFocusTrap, popFocusTrap, enterGameMode, exitGameMode }}>
      {children}
    </GamepadNavigationContext.Provider>
  );
};

export const useGamepadNavigation = () => {
  const ctx = useContext(GamepadNavigationContext);
  if (!ctx) throw new Error("useGamepadNavigation must be used within GamepadNavigationProvider");
  return ctx;
};
