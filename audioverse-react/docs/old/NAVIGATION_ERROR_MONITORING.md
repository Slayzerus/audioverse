# 🔍 Error Monitoring & Logging for Navigation System

Comprehensive guide for implementing error monitoring and logging for spatial navigation edge cases, unusual navigation patterns, and focus system anomalies.

---

## 📋 Overview

The Focusable spatial navigation system can encounter various edge cases and unusual navigation patterns that should be logged for debugging and analytics:

- **Focus traps**: User unable to navigate away from an element
- **Element disappearance**: Focusable element removed while active
- **Spatial calculation errors**: Invalid positions or dimensions
- **Gamepad disconnection**: Controller disconnects during navigation
- **Performance issues**: Focus updates taking too long
- **Duplicate IDs**: Multiple elements with same Focusable ID
- **Missing references**: Ref becomes null unexpectedly
- **Input conflicts**: Simultaneous gamepad/keyboard input

---

## 🎯 Error Categories

### Category 1: Critical Errors (Immediate Action)

#### 1.1 Focus Trap Detection
```
Description: User cannot navigate away from an element
Indicators:
- moveFocus() called but activeId unchanged 5+ times
- No valid next element found despite many attempts
- All directions (UP/DOWN/LEFT/RIGHT) fail to move focus

Logging Level: ERROR
Severity: CRITICAL
Action: Alert developer, user experience broken
```

#### 1.2 Active Element Removed
```
Description: Active focusable element deleted while focused
Indicators:
- activeId points to element no longer in focusables list
- Element ref becomes null
- setActive() fails to find the element

Logging Level: ERROR
Severity: CRITICAL
Action: Auto-redirect focus to first available element
```

#### 1.3 Context Provider Missing
```
Description: useGamepadNavigation hook used without provider
Indicators:
- Context is undefined
- Required to throw error in hook

Logging Level: ERROR
Severity: CRITICAL
Action: Show developer warning, provide fix suggestion
```

### Category 2: Warning Issues (Investigation Needed)

#### 2.1 Spatial Calculation Issues
```
Description: Elements positioned at invalid coordinates
Indicators:
- NaN in position calculations
- Infinity values in distance/angle calculations
- Element with zero width/height

Logging Level: WARN
Severity: HIGH
Action: Log issue, use fallback navigation logic
```

#### 2.2 Duplicate IDs
```
Description: Multiple elements register with same Focusable ID
Indicators:
- register() called with existing ID
- Multiple elements in focusables array with same id
- Unexpected focus behavior when navigating

Logging Level: WARN
Severity: HIGH
Action: Log which page/components have duplicates
```

#### 2.3 Reference Becomes Null
```
Description: Element ref changes to null unexpectedly
Indicators:
- ref.current?.focus() fails silently
- Element exists in DOM but ref is null
- After successful initial registration

Logging Level: WARN
Severity: MEDIUM
Action: Log element details and page context
```

#### 2.4 Rapid Focus Changes
```
Description: Focus changes too frequently (performance issue)
Indicators:
- setActiveId called 10+ times per second
- moveFocus() execution time > 50ms
- Input lag observed by user

Logging Level: WARN
Severity: MEDIUM
Action: Alert about performance regression
```

### Category 3: Navigation Edge Cases (Tracking)

#### 3.1 No Adjacent Element Found
```
Description: Direction has no valid target element
Indicators:
- moveFocus() finds no "best" element
- Falls back to edge wrapping logic
- User at edge of navigable area

Logging Level: DEBUG
Severity: LOW
Action: Track frequency, understand layout patterns
```

#### 3.2 Gamepad Deadzone Threshold Crossed
```
Description: Analog stick crosses deadzone
Indicators:
- Input transitions from 0 to > deadzone value
- Unexpected navigation triggers
- User might not have intentionally moved stick

Logging Level: DEBUG
Severity: LOW
Action: Monitor for miscalibrated gamepads
```

#### 3.3 Focus Snap to Far Element
```
Description: Focus jumps large distance unexpectedly
Indicators:
- Distance > screen width/height
- Angular difference > 45 degrees from direction
- User didn't intend the navigation

Logging Level: DEBUG
Severity: LOW
Action: Track unusual focus patterns
```

#### 3.4 Multiple Gamepads Connected
```
Description: More than one gamepad detected
Indicators:
- navigator.getGamepads() returns 2+ items
- activePadIndex might be wrong
- Input confusion possible

Logging Level: DEBUG
Severity: LOW
Action: Log which pad is active, verify correct one
```

---

## 🔧 Implementation Points

### Point 1: GamepadNavigationContext Registration

**Location**: `src/contexts/GamepadNavigationContext.tsx` - `register()` function

```typescript
const register = (meta: FocusableMeta) => {
  // Check for duplicate ID
  const existing = focusablesRef.current.find(f => f.id === meta.id);
  if (existing) {
    logger.warn('DUPLICATE_ID', {
      id: meta.id,
      newElement: meta,
      existingElement: existing,
      stackTrace: new Error().stack
    });
  }
  
  // Check for invalid dimensions
  if (meta.width <= 0 || meta.height <= 0) {
    logger.warn('INVALID_DIMENSIONS', {
      id: meta.id,
      width: meta.width,
      height: meta.height
    });
  }
  
  // Check for NaN coordinates
  if (isNaN(meta.x) || isNaN(meta.y)) {
    logger.error('NAN_COORDINATES', {
      id: meta.id,
      x: meta.x,
      y: meta.y
    });
  }
  
  setFocusables(prev => {
    if (prev.some(f => f.id === meta.id)) return prev;
    return [...prev, meta];
  });
};
```

### Point 2: Focus Movement Logic

**Location**: `src/contexts/GamepadNavigationContext.tsx` - `moveFocus()` function

```typescript
const moveFocus = (dx: number, dy: number) => {
  const startTime = performance.now();
  const currentActiveId = activeIdRef.current;
  const list = focusablesRef.current;
  
  // Track focus trap attempts
  if (!currentActiveId && list.length > 0) {
    logger.debug('AUTO_FOCUS_FIRST', {
      elementCount: list.length,
      firstId: list[0].id
    });
  }
  
  if (!currentActiveId || list.length === 0) {
    if (list.length === 0) {
      logger.warn('NO_FOCUSABLE_ELEMENTS', {
        direction: [dx, dy],
        page: window.location.pathname
      });
    }
    return;
  }
  
  const current = list.find(f => f.id === currentActiveId);
  if (!current) {
    logger.error('ACTIVE_ELEMENT_NOT_FOUND', {
      currentActiveId,
      focusableCount: list.length,
      focusableIds: list.map(f => f.id)
    });
    return;
  }
  
  // ... spatial calculation code ...
  
  // Track if no adjacent element found
  if (!best) {
    logger.debug('NO_ADJACENT_ELEMENT', {
      currentId: current.id,
      direction: [dx, dy],
      elementCount: list.length,
      currentPos: { x: current.x, y: current.y }
    });
  }
  
  if (best) {
    // Check for suspicious focus jump
    const distance = Math.sqrt(
      Math.pow(best.x - current.x, 2) + 
      Math.pow(best.y - current.y, 2)
    );
    if (distance > window.innerWidth) {
      logger.debug('LARGE_FOCUS_JUMP', {
        from: current.id,
        to: best.id,
        distance,
        viewportWidth: window.innerWidth
      });
    }
    
    setActiveId(best.id);
    activeIdRef.current = best.id;
    
    try {
      best.ref.current?.focus();
    } catch (e) {
      logger.error('FOCUS_APPLICATION_FAILED', {
        elementId: best.id,
        error: e.message
      });
    }
  }
  
  // Track performance
  const duration = performance.now() - startTime;
  if (duration > 50) {
    logger.warn('SLOW_FOCUS_MOVE', {
      duration,
      elementCount: list.length,
      page: window.location.pathname
    });
  }
};
```

### Point 3: Unregister with Validation

**Location**: `src/contexts/GamepadNavigationContext.tsx` - `unregister()` function

```typescript
const unregister = (id: string) => {
  const wasActive = activeIdRef.current === id;
  
  setFocusables(prev => {
    const filtered = prev.filter(f => f.id !== id);
    
    // If we removed the active element, redirect focus
    if (wasActive && filtered.length > 0) {
      logger.warn('ACTIVE_ELEMENT_REMOVED', {
        removedId: id,
        redirectingTo: filtered[0].id,
        page: window.location.pathname
      });
      
      setActiveId(filtered[0].id);
      activeIdRef.current = filtered[0].id;
      filtered[0].ref.current?.focus();
    } else if (wasActive && filtered.length === 0) {
      logger.error('ACTIVE_ELEMENT_REMOVED_NO_FALLBACK', {
        removedId: id,
        page: window.location.pathname
      });
      setActiveId(null);
      activeIdRef.current = null;
    }
    
    return filtered;
  });
};
```

### Point 4: Gamepad Event Handling

**Location**: `src/contexts/GamepadNavigationContext.tsx` - `handleGamepad()` function

```typescript
const handleGamepad = () => {
  const pads = navigator.getGamepads 
    ? Array.from(navigator.getGamepads()).filter(Boolean) 
    : [];
  
  if (pads.length === 0) {
    if (lastPadCount > 0) {
      logger.debug('GAMEPADS_DISCONNECTED', {
        previousCount: lastPadCount
      });
    }
    lastPadCount = 0;
    return;
  }
  
  if (pads.length > 1) {
    logger.debug('MULTIPLE_GAMEPADS_CONNECTED', {
      count: pads.length,
      activePadIndex: activePadIndexRef.current,
      padIds: pads.map((p, i) => ({ index: i, id: p?.id }))
    });
  }
  
  const pad = pads[activePadIndexRef.current];
  if (!pad) {
    logger.warn('ACTIVE_GAMEPAD_NOT_FOUND', {
      activePadIndex: activePadIndexRef.current,
      totalPads: pads.length
    });
    return;
  }
  
  // Check button state changes
  const buttons = pad.buttons;
  const dPadUp = buttons[12]?.pressed;
  const dPadDown = buttons[13]?.pressed;
  const dPadLeft = buttons[14]?.pressed;
  const dPadRight = buttons[15]?.pressed;
  
  // ... navigation logic ...
  
  // Track unusual input patterns
  if ((dPadUp && dPadDown) || (dPadLeft && dPadRight)) {
    logger.debug('CONFLICTING_D_PAD_INPUT', {
      up: dPadUp,
      down: dPadDown,
      left: dPadLeft,
      right: dPadRight
    });
  }
};
```

### Point 5: Focusable Component Mount/Unmount

**Location**: `src/components/common/Focusable.tsx` - useEffect

```typescript
useEffect(() => {
  // Validate ref exists
  if (!ref.current) {
    logger.error('FOCUSABLE_REF_NULL_ON_MOUNT', {
      id,
      page: window.location.pathname
    });
    return;
  }
  
  try {
    register({ id, ref, ...layout, isDropdown });
    
    logger.debug('FOCUSABLE_REGISTERED', {
      id,
      position: { x: layout.x, y: layout.y },
      size: { width: layout.width, height: layout.height }
    });
  } catch (error) {
    logger.error('FOCUSABLE_REGISTRATION_FAILED', {
      id,
      error: error.message
    });
  }
  
  return () => {
    try {
      unregister(id);
      logger.debug('FOCUSABLE_UNREGISTERED', { id });
    } catch (error) {
      logger.error('FOCUSABLE_UNREGISTRATION_FAILED', {
        id,
        error: error.message
      });
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id, layout.x, layout.y, layout.width, layout.height, isDropdown]);
```

---

## 📊 Logging System Implementation

### Logger Service

Create `src/services/navigationLogger.ts`:

```typescript
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  code: string;
  timestamp: number;
  data: any;
  page: string;
  userAgent: string;
}

class NavigationLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  
  private createEntry(level: LogLevel, code: string, data: any): LogEntry {
    return {
      level,
      code,
      timestamp: Date.now(),
      data,
      page: window.location.pathname,
      userAgent: navigator.userAgent
    };
  }
  
  debug(code: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createEntry('DEBUG', code, data);
      console.log(`[NAV-DEBUG] ${code}`, data);
      this.addLog(entry);
    }
  }
  
  warn(code: string, data?: any) {
    const entry = this.createEntry('WARN', code, data);
    console.warn(`[NAV-WARN] ${code}`, data);
    this.addLog(entry);
    
    // Send to analytics
    this.sendToAnalytics(entry);
  }
  
  error(code: string, data?: any) {
    const entry = this.createEntry('ERROR', code, data);
    console.error(`[NAV-ERROR] ${code}`, data);
    this.addLog(entry);
    
    // Send to error tracking service
    this.sendToErrorTracking(entry);
  }
  
  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest
    }
  }
  
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  getLogsByCode(code: string): LogEntry[] {
    return this.logs.filter(log => log.code === code);
  }
  
  private sendToAnalytics(entry: LogEntry) {
    // TODO: Integrate with analytics service
    // window.gtag?.event('navigation_warning', { ...entry });
  }
  
  private sendToErrorTracking(entry: LogEntry) {
    // TODO: Integrate with error tracking (Sentry, etc)
    // Sentry.captureException(new Error(entry.code), { extra: entry.data });
  }
  
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  clearLogs() {
    this.logs = [];
  }
}

export const navigationLogger = new NavigationLogger();
```

---

## 🎯 Error Code Reference

| Code | Level | Meaning |
|------|-------|---------|
| `DUPLICATE_ID` | WARN | Multiple elements with same Focusable ID |
| `INVALID_DIMENSIONS` | WARN | Element has zero or negative width/height |
| `NAN_COORDINATES` | ERROR | Position contains NaN value |
| `AUTO_FOCUS_FIRST` | DEBUG | No active element, focusing first available |
| `NO_FOCUSABLE_ELEMENTS` | WARN | No focusable elements found on page |
| `ACTIVE_ELEMENT_NOT_FOUND` | ERROR | Active element removed from focus list |
| `NO_ADJACENT_ELEMENT` | DEBUG | Direction has no valid target |
| `LARGE_FOCUS_JUMP` | DEBUG | Focus moved unusually large distance |
| `SLOW_FOCUS_MOVE` | WARN | Focus movement took > 50ms |
| `FOCUS_APPLICATION_FAILED` | ERROR | Could not call focus() on element |
| `ACTIVE_ELEMENT_REMOVED` | WARN | Active element unregistered, redirecting focus |
| `ACTIVE_ELEMENT_REMOVED_NO_FALLBACK` | ERROR | Active element removed, no fallback available |
| `GAMEPADS_DISCONNECTED` | DEBUG | Gamepad disconnected |
| `MULTIPLE_GAMEPADS_CONNECTED` | DEBUG | Multiple gamepads detected |
| `ACTIVE_GAMEPAD_NOT_FOUND` | WARN | Active gamepad index invalid |
| `CONFLICTING_D_PAD_INPUT` | DEBUG | Opposing D-Pad buttons pressed simultaneously |
| `FOCUSABLE_REF_NULL_ON_MOUNT` | ERROR | Focusable component ref is null |
| `FOCUSABLE_REGISTRATION_FAILED` | ERROR | Could not register focusable element |
| `FOCUSABLE_UNREGISTRATION_FAILED` | ERROR | Could not unregister focusable element |

---

## 📈 Monitoring Dashboard Hooks

### React Component for Debugging

Create `src/components/debug/NavigationDebugPanel.tsx`:

```typescript
import React, { useState } from 'react';
import { navigationLogger } from '../../services/navigationLogger';
import './NavigationDebugPanel.css';

export const NavigationDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('');
  
  const logs = navigationLogger.getLogs();
  const filtered = logs.filter(log => 
    filter === '' || log.code.includes(filter) || log.level.includes(filter)
  );
  
  if (!isOpen) {
    return (
      <button 
        className="debug-toggle"
        onClick={() => setIsOpen(true)}
      >
        🔍 Nav Debug
      </button>
    );
  }
  
  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>Navigation Debug</h3>
        <button onClick={() => setIsOpen(false)}>Close</button>
        <button onClick={() => navigationLogger.clearLogs()}>Clear</button>
        <button onClick={() => {
          const logs = navigationLogger.exportLogs();
          const blob = new Blob([logs], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nav-logs-${Date.now()}.json`;
          a.click();
        }}>Export</button>
      </div>
      
      <input 
        type="text"
        placeholder="Filter logs..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="debug-filter"
      />
      
      <div className="debug-stats">
        <div>Total: {logs.length}</div>
        <div>Errors: {logs.filter(l => l.level === 'ERROR').length}</div>
        <div>Warnings: {logs.filter(l => l.level === 'WARN').length}</div>
      </div>
      
      <div className="debug-logs">
        {filtered.map((log, i) => (
          <div key={i} className={`log-entry log-${log.level.toLowerCase()}`}>
            <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="log-level">{log.level}</span>
            <span className="log-code">{log.code}</span>
            <details>
              <summary>Details</summary>
              <pre>{JSON.stringify(log.data, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔗 Integration Checklist

- [ ] Create `src/services/navigationLogger.ts`
- [ ] Add logger calls to `GamepadNavigationContext.tsx`:
  - [ ] `register()` function
  - [ ] `unregister()` function
  - [ ] `moveFocus()` function
  - [ ] `handleGamepad()` event handler
- [ ] Add logger calls to `Focusable.tsx`:
  - [ ] useEffect registration/unregistration
  - [ ] Error handling
- [ ] Create debug panel component (optional for dev)
- [ ] Set up analytics integration
- [ ] Set up error tracking service (Sentry/etc)
- [ ] Add environment variables for log levels
- [ ] Document log review procedures

---

## 🎯 Error Recovery Strategies

### Strategy 1: Focus Trap Detection & Recovery
```typescript
if (noAdjactentElement && attemptCount > 5) {
  logger.warn('POSSIBLE_FOCUS_TRAP', { ...context });
  // Fallback: Focus on first element
  setActive(focusables[0].id);
}
```

### Strategy 2: Missing Reference Recovery
```typescript
try {
  ref.current?.focus();
} catch (e) {
  logger.error('FOCUS_FAILED', { elementId: id });
  // Fallback: Focus on first available
  const first = focusables[0];
  first?.ref.current?.focus();
}
```

### Strategy 3: Gamepad Disconnection
```typescript
if (pads.length === 0) {
  logger.info('GAMEPAD_DISCONNECTED', {});
  // Keep keyboard/mouse navigation working
  // Don't crash, just disable gamepad input
}
```

---

## 📊 Sample Error Log Export

```json
{
  "logs": [
    {
      "level": "DEBUG",
      "code": "FOCUSABLE_REGISTERED",
      "timestamp": 1643299200000,
      "data": {
        "id": "PlayerPage-player-name",
        "position": { "x": 100, "y": 50 },
        "size": { "width": 200, "height": 40 }
      },
      "page": "/profile/players",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "level": "WARN",
      "code": "DUPLICATE_ID",
      "timestamp": 1643299205000,
      "data": {
        "id": "PlayerPage-create-btn",
        "existingElement": { "id": "PlayerPage-create-btn" }
      },
      "page": "/profile/players",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

---

## ✅ Success Criteria

- [x] All error categories documented
- [x] Implementation points identified
- [x] Logger service designed
- [x] Error codes documented
- [x] Recovery strategies outlined
- [x] Debug tools outlined
- [x] Integration checklist created

---

*Document Version: 1.0*
*Last Updated: January 27, 2026*
*Status: Ready for Implementation*
