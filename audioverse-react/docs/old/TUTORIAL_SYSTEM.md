# Tutorial System Documentation

## Overview

AudioVerse includes a comprehensive tutorial system that guides users through different pages and features of the application. The system provides interactive, step-by-step overlays with spotlight effects, keyboard navigation, and animations.

## Architecture

### Core Components

#### 1. **TutorialContext** (`src/contexts/TutorialContext.tsx`)
Manages global tutorial state including:
- Active tutorial and current step
- Completed tutorials tracking (persisted in localStorage)
- Tutorial progression (next/previous/skip/complete)
- Reset functionality

#### 2. **TutorialOverlay** (`src/components/common/TutorialOverlay.tsx`)
Renders the tutorial UI:
- Animated tooltips with positioning (top/bottom/left/right/center)
- Spotlight effect highlighting target elements
- Progress indicators (dots)
- Keyboard navigation support
- Responsive design for mobile/desktop

#### 3. **useTutorial Hook** (`src/hooks/useTutorial.ts`)
Simplified hook for triggering tutorials on page components:
```tsx
const songBrowserSteps: TutorialStep[] = [...];
useTutorial('song-browser', songBrowserSteps);
```

## Tutorial Structure

### TutorialStep Interface

```typescript
interface TutorialStep {
  id: string;                    // Unique step identifier
  targetElementId?: string;      // DOM element ID to highlight
  title: string;                 // Step title
  description: string;           // Step description
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
```

## Creating Tutorials

### Step 1: Define Tutorial Steps

Create tutorial definitions in `src/utils/tutorialDefinitions.ts`:

```typescript
export const myPageTutorial: TutorialStep[] = [
  {
    id: 'my-page-welcome',
    targetElementId: 'page-my-page',
    title: '👋 Welcome!',
    description: 'This is the introduction...',
    position: 'center'
  },
  {
    id: 'my-page-feature',
    targetElementId: 'feature-button',
    title: '✨ Cool Feature',
    description: 'Click here to use this feature...',
    position: 'bottom'
  }
];
```

### Step 2: Add Element IDs to Components

Ensure your components have IDs matching `targetElementId`:

```tsx
<div id="feature-button">
  <button>My Feature</button>
</div>
```

### Step 3: Integrate Tutorial in Page Component

```tsx
import { useTutorial } from '../../hooks/useTutorial';
import { myPageTutorial } from '../../utils/tutorialDefinitions';

const MyPage: React.FC = () => {
  useTutorial('my-page', myPageTutorial);
  
  return <div id="page-my-page">...</div>;
};
```

## Existing Tutorials

The following tutorials are pre-configured:

| Page | Tutorial ID | Description |
|------|-------------|-------------|
| Home | `home-page` | App overview and navigation |
| Song Browser | `song-browser` | Browsing and selecting songs |
| Karaoke Round | `karaoke-round` | Singing interface and controls |
| Controller Settings | `controller-settings` | Gamepad configuration |
| Audio Editor | `audio-editor` | DAW interface and tools |
| Music Player | `music-player` | Player features and controls |

## User Interactions

### Keyboard Shortcuts

- **Enter / Space**: Next step
- **Left Arrow**: Previous step
- **Right Arrow**: Next step
- **ESC**: Skip tutorial

### Mouse/Touch

- **Next Button**: Advance to next step
- **Back Button**: Return to previous step
- **Skip Button**: Exit tutorial
- **Click Outside**: Tutorial remains open (must skip explicitly)

## Features

### 1. **Spotlight Effect**
- Darkens the entire page except the target element
- Animated pulse effect on highlighted element
- Smooth transitions between steps

### 2. **Smart Positioning**
- Automatically positions tooltips to avoid screen edges
- Falls back to center position if element not found
- Responsive adjustments for mobile devices

### 3. **Progress Tracking**
- Visual progress dots showing current step
- Completed tutorials are saved in localStorage
- Users won't see the same tutorial twice

### 4. **Reset Functionality**
- Users can reset all tutorials via Settings menu
- Accessible from navbar: Settings → Reset Tutorials

### 5. **Animations**
```css
/* Smooth entrance animations */
@keyframes fadeIn { ... }
@keyframes slideIn { ... }
@keyframes spotlightPulse { ... }
@keyframes dotPulse { ... }
```

## Best Practices

### Tutorial Design

1. **Keep It Short**: 3-7 steps per tutorial
2. **Focus on Essentials**: Highlight key features only
3. **Use Emojis**: Make titles engaging (✨ 🎤 🎮)
4. **Clear Descriptions**: Explain what and why
5. **Logical Flow**: Follow natural user workflow

### Element IDs

```tsx
// ✅ Good: Descriptive and unique
<button id="export-project-btn">Export</button>

// ❌ Bad: Generic or duplicate
<button id="button1">Export</button>
```

### Target Elements

- Use stable IDs that won't change
- Ensure elements are visible when tutorial starts
- Consider loading states and async content

### Tutorial Timing

```tsx
// Default: Auto-start after 500ms delay
useTutorial('my-tutorial', steps);

// Manual trigger: Set autoStart to false
useTutorial('my-tutorial', steps, false);
```

## Styling

### Theme Support

The tutorial system respects the app's theme (dark/light mode):

```css
.tutorial-overlay {
  /* Uses CSS variables from theme system */
  background: rgba(0, 0, 0, 0.85);
}

.tutorial-tooltip {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}
```

### Custom Styling

Override styles in your component:

```css
#my-page .tutorial-tooltip {
  /* Custom tooltip styles */
}
```

## Advanced Usage

### Conditional Tutorials

```tsx
const { startTutorial, hasCompletedTutorial } = useTutorial(
  'advanced-tutorial',
  steps,
  false // Don't auto-start
);

// Start only if user meets certain criteria
useEffect(() => {
  if (userIsNewbie && !hasCompletedTutorial('advanced-tutorial')) {
    startTutorial('advanced-tutorial', steps);
  }
}, [userIsNewbie]);
```

### Multi-Page Tutorials

For tutorials spanning multiple pages, use route-based detection:

```tsx
import { tutorialsByRoute, getTutorialForRoute } from '../utils/tutorialDefinitions';

const location = useLocation();
const tutorial = getTutorialForRoute(location.pathname);

if (tutorial) {
  useTutorial(`route-${location.pathname}`, tutorial);
}
```

### Dynamic Target Elements

If elements are loaded dynamically:

```tsx
useEffect(() => {
  const checkElement = setInterval(() => {
    if (document.getElementById('dynamic-element')) {
      clearInterval(checkElement);
      startTutorial('my-tutorial', steps);
    }
  }, 100);
  
  return () => clearInterval(checkElement);
}, []);
```

## Accessibility

### Screen Reader Support

- Tutorial overlay has `role="dialog"` and `aria-labelledby`
- Progress indicators have `aria-label` attributes
- Buttons have descriptive labels
- Focus is managed during tutorial progression

### Keyboard Navigation

All tutorial controls are fully keyboard-accessible without requiring a mouse.

### Visual Indicators

- High contrast colors for readability
- Large clickable areas for buttons
- Clear visual hierarchy

## Performance

### Optimization Strategies

1. **Lazy Loading**: Tutorial overlay only renders when active
2. **Memoization**: Tutorial definitions are memoized
3. **LocalStorage Caching**: Completed tutorials cached client-side
4. **Debounced Positioning**: Window resize calculations are debounced

## Troubleshooting

### Tutorial Not Appearing

1. Check if tutorial was previously completed (reset in Settings)
2. Verify element IDs match `targetElementId`
3. Ensure `TutorialProvider` is in `main.tsx`
4. Check browser console for errors

### Element Not Highlighted

1. Element may not be mounted yet (add delay)
2. Element might be hidden (check CSS visibility)
3. ID might be incorrect (inspect DOM)

### Positioning Issues

1. Target element might be too close to screen edge
2. Element might have `position: fixed` (adjust z-index)
3. Try different `position` values in step definition

## API Reference

### TutorialContext Methods

```typescript
interface TutorialContextType {
  startTutorial: (id: string, steps: TutorialStep[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetCompletedTutorials: () => void;
  hasCompletedTutorial: (id: string) => boolean;
  activeTutorial: { id: string; steps: TutorialStep[] } | null;
  currentStepIndex: number;
}
```

### useTutorial Hook

```typescript
function useTutorial(
  tutorialId: string,
  steps: TutorialStep[],
  autoStart?: boolean
): {
  startTutorial: (id: string, steps: TutorialStep[]) => void;
  hasCompletedTutorial: (id: string) => boolean;
}
```

## Examples

### Complete Page Integration

```tsx
import React from 'react';
import { useTutorial } from '../../hooks/useTutorial';

const MyFeaturePage: React.FC = () => {
  const myTutorial: TutorialStep[] = [
    {
      id: 'welcome',
      targetElementId: 'page-my-feature',
      title: '🎉 Welcome to My Feature!',
      description: 'Let me show you around...',
      position: 'center'
    },
    {
      id: 'main-button',
      targetElementId: 'main-action-btn',
      title: '▶️ Main Action',
      description: 'Click here to perform the main action.',
      position: 'bottom'
    }
  ];

  useTutorial('my-feature', myTutorial);

  return (
    <div id="page-my-feature">
      <h1>My Feature</h1>
      <button id="main-action-btn">Do Something</button>
    </div>
  );
};

export default MyFeaturePage;
```

## Future Enhancements

Potential improvements for the tutorial system:

- [ ] Video tutorials integration
- [ ] Interactive "try it yourself" steps
- [ ] Tutorial branching based on user choices
- [ ] Analytics tracking for tutorial completion rates
- [ ] Multi-language support
- [ ] Tour builder UI for non-developers
- [ ] Tutorial export/import functionality
- [ ] A/B testing different tutorial flows

## Contributing

When adding new tutorials:

1. Add tutorial definition to `tutorialDefinitions.ts`
2. Integrate using `useTutorial` hook
3. Add element IDs to relevant components
4. Test on mobile and desktop
5. Update this documentation

---

**Last Updated**: 2024
**Version**: 1.0
**Maintainer**: AudioVerse Team
