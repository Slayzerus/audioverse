# Gamepad Navigation System Documentation

## Overview

The gamepad navigation system provides spatial navigation and focus management for gamepad and keyboard input across the application. It's built around two core components:

1. **GamepadNavigationContext** - Global navigation state and event handling
2. **Focusable** - Wrapper component for interactive elements

## Architecture

### GamepadNavigationContext

Located in: `src/contexts/GamepadNavigationContext.tsx`

**Responsibilities:**
- Register/unregister focusable elements with their screen positions
- Track currently active element
- Handle gamepad input (buttons, axes, D-pad)
- Handle keyboard input (arrows, Enter, Space, ESC, Tab)
- Compute spatial navigation (closest element in direction)
- Auto-focus first element to prevent focus traps
- Apply user-configurable button mappings and deadzone

**Key Features:**
- Uses refs for stable event handlers (no listener re-attachment)
- Gamepad polling starts/stops based on connection events
- Supports multi-gamepad auto-switching on input
- Edge wrapping when no element found in direction
- Custom event-driven mapping updates

### Focusable Component

Located in: `src/components/common/Focusable.tsx`

**Responsibilities:**
- Wrap interactive elements (buttons, links, inputs)
- Register element position with navigation context
- Apply visual focus state (`focusable-active` class)
- Provide accessible labels and roles

**Props:**
- `id` (required): Unique identifier for navigation
- `isDropdown`: Boolean flag for special dropdown handling
- `ariaLabel`: Accessibility label (defaults to id)
- `role`: ARIA role
- `className`, `style`: Standard React props

## Usage

### Basic Usage

```tsx
import { Focusable } from "../../components/common/Focusable";

<Focusable id="my-button" ariaLabel="Confirm action">
  <button onClick={handleClick}>Confirm</button>
</Focusable>
```

### Dropdown Elements

```tsx
<Focusable id="my-select" isDropdown={true}>
  <select value={value} onChange={handleChange}>
    <option value="a">Option A</option>
    <option value="b">Option B</option>
  </select>
</Focusable>
```

### Custom Styling

```tsx
<Focusable 
  id="styled-button"
  className="custom-class"
  style={{ padding: 12 }}
>
  <button>Action</button>
</Focusable>
```

## Input Mapping

### Default Controls

**Gamepad:**
- Left stick / D-pad: Navigate
- A button (configurable): Confirm/activate
- B button (configurable): Back (not yet implemented)

**Keyboard:**
- Arrow keys: Navigate
- Enter / Space: Confirm/activate
- ESC: Browser back
- Tab / Shift+Tab: Native focus cycling (preserved)

### Customization

Users can customize gamepad mappings via the Controller Settings page (`/settings/controller`):

**Configurable Settings:**
- Confirm button (A/B/X/Y)
- Back button (A/B/X/Y)
- Deadzone (0.0 - 0.6)

**Storage:**
Settings are persisted in `localStorage` under key `gamepadMapping` with the following schema:

```typescript
{
  confirmButton: number;  // Button index (0=A, 1=B, 2=X, 3=Y)
  backButton: number;
  deadzone: number;       // 0.0 to 1.0
}
```

**Programmatic Access:**

```typescript
import { loadGamepadMapping, saveGamepadMapping, GamepadMapping } from "../utils/gamepadMapping";

const mapping = loadGamepadMapping();
const updated = saveGamepadMapping({ confirmButton: 1, backButton: 0, deadzone: 0.3 });
```

## Spatial Navigation Algorithm

The navigation system uses a scoring algorithm to find the best element in a given direction:

1. Filter elements not in the intended direction
2. For each candidate, compute:
   - `angle`: Difference between element direction and movement direction
   - `distance`: Euclidean distance between centers
   - `score = angleScore * 2 + distance`
3. Select element with lowest score
4. If no candidates, wrap to farthest element in that direction

## Focus Trap Prevention

If navigation is attempted without an active element:
- System automatically focuses the first registered focusable
- Prevents "stuck" state where no navigation is possible

## Performance Optimizations

1. **Stable event handlers**: Uses refs to avoid re-attaching listeners on state changes
2. **Efficient polling**: Gamepad polling only runs when gamepads are connected
3. **Layout caching**: Element positions cached and updated only on resize
4. **Minimal re-renders**: Navigation state changes don't trigger child re-renders

## Best Practices

### Do's
- Use unique, descriptive IDs for each Focusable
- Provide meaningful `ariaLabel` for screen readers
- Test spatial layout with different screen sizes
- Group related controls visually to improve navigation flow
- Set initial focus on page load with `setActive(id)`

### Don'ts
- Don't wrap large containers in Focusable (wrap actual interactive elements)
- Don't use dynamic IDs that change on re-render
- Don't nest Focusable components
- Don't override Tab key behavior
- Don't call `moveFocus` directly unless implementing custom navigation

## Accessibility

The system includes screen reader support:
- All focusable elements have `tabIndex={0}` for keyboard access
- `aria-label` defaults to element ID (override with prop)
- Visual focus indicator (outline + class)
- Respects native Tab navigation for form elements
- ESC key support for back navigation

## Integration Checklist

When adding navigation to a new page:

- [ ] Wrap all interactive elements in `Focusable`
- [ ] Assign unique IDs to each element
- [ ] Test gamepad navigation flow
- [ ] Test keyboard navigation (arrows, Enter, ESC)
- [ ] Test Tab cycling through form elements
- [ ] Verify focus indicator visibility
- [ ] Add appropriate `ariaLabel` for screen readers
- [ ] Test on different screen sizes
- [ ] Ensure first element auto-focuses if needed

## Troubleshooting

**Navigation not working:**
- Check console for "useGamepadNavigation must be used within GamepadNavigationProvider" error
- Verify element is wrapped in `<Focusable>` with unique ID
- Confirm element is visible on screen (layout x/y/width/height valid)

**Focus indicator not showing:**
- Verify `.focusable-active` class is being applied
- Check that global styles in `GamepadFocusStyle.css` are loaded
- Override outline style if needed with `style` prop

**Gamepad not detected:**
- Check browser gamepad support (chrome://gamepad)
- Verify gamepad is connected before page load or press any button after connecting
- Check console for connection/disconnection logs

**Movement feels unresponsive:**
- Adjust deadzone in controller settings
- Verify 200ms movement throttle isn't too aggressive for your use case

## Future Enhancements

- Zone-based navigation for complex layouts
- Focus memory per page/route
- Haptic feedback support
- Multiple simultaneous players with separate focus states

## Recent Changes

### Scroll Into View on Focus (v2)
Gamepad navigation now automatically scrolls focused elements into view using `scrollIntoView({ block: 'nearest', behavior: 'smooth' })`. This prevents off-screen elements from being focused without visual feedback. Applied in both best-match and edge-wrap branches of `moveFocus`.

### Input Activation (v2)
The gamepad confirm handler now activates `<select>` elements (via `showPicker()`) and `<input>` elements (via `focus()`) inside Focusable wrappers, making forms fully navigable with a gamepad.

### Highlight Modes (v2)
Focusable now supports a `highlightMode` prop with five visual styles:
- `outline` (default) — classic focus outline
- `dim` — dims surrounding content
- `brighten` — brightens focused element
- `glow` — adds a glow effect around the element
- `scale` — scales up the focused element

### Focus Traps for Modals (v2)
New `useModalFocusTrap` hook (`src/hooks/useModalFocusTrap.ts`) provides automatic focus trap management for Bootstrap modals. When a modal opens, gamepad navigation is constrained to elements within that modal. When it closes, the trap is released.

```tsx
import { useModalFocusTrap } from "../../hooks/useModalFocusTrap";

// Inside a component with a modal:
useModalFocusTrap(showModal, "modal-prefix-", {
    onDismiss: () => setShowModal(false),
    initialActive: "modal-prefix-first-btn",
});
```

### CarouselNav Component (v2)
New `CarouselNav` component (`src/components/common/CarouselNav.tsx`) provides a horizontal scrolling carousel optimized for gamepad navigation. Features:
- Scroll-snap carousel with configurable card count and height
- Hierarchical drill-down levels with breadcrumb navigation
- Each item wrapped in Focusable with `scale` highlight mode
- Edge arrow indicators for large carousels
- Integrated into KaraokeSongBrowser for gamepad-friendly filter browsing

```tsx
import { CarouselNav, type CarouselLevel } from "../../components/common/CarouselNav";

const levels: CarouselLevel[] = [
    { title: "Categories", items: [
        { id: "all", label: "All", icon: "🎵" },
        { id: "rock", label: "Rock", icon: "🎸" },
    ]},
];

<CarouselNav levels={levels} onSelect={handleSelect} idPrefix="my-carousel-" />
```

### Pages with Focusable (v2)
The following pages now have full gamepad navigation support:
- **HomePage** — action cards, auth links, party cards
- **PlayPage** — all 10 navigation cards
- **SettingsPage** — difficulty select, settings links
- **DisplaySettingsPage** — preset buttons, animation modes, font options, color inputs
- **ControllerPage** — mapping selects, deadzone range, save button
- **CampaignsPage** — template start buttons, campaign cards, start modal
- **CampaignDetailPage** — join button, play buttons, song picker modal
- **PartiesPage**, **PartyPage**, **PlaylistsPage**, **PlayerPage**, **ChangePasswordPage** (already had)
