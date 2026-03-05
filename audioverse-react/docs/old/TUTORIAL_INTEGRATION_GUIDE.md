"""
TUTORIAL SYSTEM ARCHITECTURE & INTEGRATION GUIDE
================================================

1. SYSTEM ARCHITECTURE
======================

┌─────────────────────────────────────────────────────────────┐
│                      App Root (main.tsx)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TutorialProvider (manages state & localStorage)     │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │          App.tsx                                │ │  │
│  │  │ ┌─────────────────────────────────────────────┐ │ │  │
│  │  │ │ TutorialOverlay (global rendering)          │ │ │  │
│  │  │ │ ┌─────────────────────────────────────────┐ │ │ │  │
│  │  │ │ │   Page Routes                          │ │ │ │  │
│  │  │ │ │  ┌─────────────────────────────────┐  │ │ │ │  │
│  │  │ │ │  │ Song Browser Page               │  │ │ │ │  │
│  │  │ │ │  │ - useTutorialPage hook          │  │ │ │ │  │
│  │  │ │ │  │ - Defines: pageId, steps        │  │ │ │ │  │
│  │  │ │ │  │ - Auto-start on first visit     │  │ │ │ │  │
│  │  │ │ │  └─────────────────────────────────┘  │ │ │ │  │
│  │  │ │ │  ┌─────────────────────────────────┐  │ │ │ │  │
│  │  │ │ │  │ Other Pages (similar setup)      │  │ │ │ │  │
│  │  │ │ │  │ - Controller Settings            │  │ │ │ │  │
│  │  │ │ │  │ - Karaoke Round                 │  │ │ │ │  │
│  │  │ │ │  │ - Home Page                     │  │ │ │ │  │
│  │  │ │ │  │ - Audio Editor                  │  │ │ │ │  │
│  │  │ │ │  │ - Music Player                  │  │ │ │ │  │
│  │  │ │ │  └─────────────────────────────────┘  │ │ │ │  │
│  │  │ │ └─────────────────────────────────────────┘ │ │ │  │
│  │  │ └─────────────────────────────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘


2. DATA FLOW
============

User Visits Page
       │
       ▼
TutorialProvider checks localStorage
       │
       ├─ If completed: Do nothing
       │
       └─ If NOT completed:
          useTutorialPage hook calls startTutorial()
                │
                ▼
          TutorialContext activates tutorial
                │
                ├─ Sets current step = 0
                ├─ Sets isActive = true
                └─ Highlights target element
                      │
                      ▼
          TutorialOverlay renders
                │
          ┌─────┴─────────────┐
          │                   │
    User presses key    User clicks button
          │                   │
    Enter/Space →        Next/Previous/Skip
    Arrow keys                │
          │                   │
          └─────┬─────────────┘
                │
                ▼
    Move to next/previous step
                │
                └─ Last step? → Mark complete → Save to localStorage


3. FILE STRUCTURE
=================

src/
├── contexts/
│   └── TutorialContext.tsx          # State management & hooks
│
├── components/
│   └── common/
│       ├── TutorialOverlay.tsx       # UI rendering
│       └── TutorialOverlay.css       # Animations & styling
│
├── hooks/
│   └── useTutorial.ts               # useTutorialPage hook
│
├── utils/
│   └── tutorialDefinitions.ts       # 31 pre-built tutorial steps
│
├── pages/
│   ├── party/
│   │   └── KaraokeSongBrowserPage.tsx # Example integration
│   └── [other pages]
│
├── App.tsx                           # Renders TutorialOverlay
├── main.tsx                          # Wraps with TutorialProvider
└── Navbar.tsx                        # Reset tutorials button


4. INTEGRATION STEPS
====================

Step 1: Create Tutorial Definition
──────────────────────────────────
In tutorialDefinitions.ts:

export const myPageTutorial: TutorialStep[] = [
  {
    id: 'step-1',
    targetElement: 'element-id',
    title: '📌 First Step',
    content: 'Explanation...',
    position: 'bottom'
  },
  // ... more steps
];


Step 2: Add DOM IDs
──────────────────
In your component:

<div id="element-id">
  <button>Important action</button>
</div>


Step 3: Use Hook
────────────────
In your page component:

import { useTutorialPage } from '../../hooks/useTutorial';
import { myPageTutorial } from '../../utils/tutorialDefinitions';

const MyPage = () => {
  useTutorialPage('my-page', myPageTutorial);
  return <div id="page-my-page">...</div>;
};


5. EXAMPLE: ADDING TUTORIAL TO CONTROLLER PAGE
===============================================

BEFORE:
─────
// src/pages/settings/ControllerPage.tsx
const ControllerPage: React.FC = () => {
  return (
    <div id="page-settings-controller">
      <div id="controller-status">Status: {status}</div>
      <div id="button-mapping-section">Mapping...</div>
    </div>
  );
};

AFTER:
─────
import { useTutorialPage } from '../../hooks/useTutorial';
import { controllerSettingsTutorial } from '../../utils/tutorialDefinitions';

const ControllerPage: React.FC = () => {
  useTutorialPage('controller-settings', controllerSettingsTutorial);
  
  return (
    <div id="page-settings-controller">
      <div id="controller-status">Status: {status}</div>
      <div id="button-mapping-section">Mapping...</div>
    </div>
  );
};

That's it! Tutorial auto-starts on first visit.


6. TUTORIAL DEFINITIONS (31 STEPS)
==================================

Song Browser (5 steps)
├─ Welcome to Song Browser
├─ Game Settings
├─ Group Songs
├─ Filter Options
└─ Start Singing

Karaoke Round (5 steps)
├─ Ready to Sing
├─ Note Timeline
├─ Lyrics Display
├─ Pitch Feedback
└─ Score & Feedback

Controller Settings (5 steps)
├─ Controller Settings
├─ Controller Status
├─ Button Mapping
├─ Deadzone Settings
└─ Test Your Settings

Home Page (5 steps)
├─ Welcome to AudioVerse
├─ Navigation Bar
├─ Play Karaoke
├─ Create Music
└─ Settings & Profile

Audio Editor (6 steps)
├─ Audio Editor
├─ Timeline
├─ Track List
├─ Tools
├─ Recording
└─ Export Project

Music Player (5 steps)
├─ Music Player
├─ Your Library
├─ Playback Controls
├─ Play Queue
└─ Audio Visualizer


7. USER INTERACTIONS
====================

Keyboard:
─────────
Enter / Space  →  Next step
Left Arrow     →  Previous step
Right Arrow    →  Next step
ESC            →  Skip tutorial

Mouse/Touch:
────────────
Next Button    →  Proceed to next step
Back Button    →  Go to previous step
Skip Button    →  Exit tutorial
Close Button   →  Exit tutorial

Features:
─────────
- Spotlight effect on target element
- Progress dots showing current step
- Smooth animations between steps
- Responsive positioning (top/bottom/left/right/center)
- Persists completed tutorials in localStorage
- Reset available in Settings menu


8. CONFIGURATION
================

AutoStart (Default: True)
─────────────────────────
// Start automatically on first visit
useTutorialPage('page-id', steps);

// Manual trigger
useTutorialPage('page-id', steps, false);
// Then: tutorialContext.startTutorial(...)


Position Options
────────────────
'top'      - Tooltip above element
'bottom'   - Tooltip below element (default)
'left'     - Tooltip left of element
'right'    - Tooltip right of element
'center'   - Tooltip centered on screen


9. TESTING
==========

Manual Tests:
─────────────
□ Visit page → tutorial appears
□ Press Enter → next step
□ Press ESC → skips
□ Revisit page → tutorial doesn't appear
□ Reset tutorials → tutorial appears again
□ Mobile view → responsive positioning
□ Dark mode → correct colors

Automated Tests (future):
─────────────────────────
□ useTutorialPage hook tests
□ TutorialContext state tests
□ localStorage persistence tests
□ Navigation tests
□ Keyboard event tests


10. COMMON ISSUES & FIXES
=========================

Issue: Tutorial doesn't appear
Fix:
1. Check if tutorial completed: Settings → Reset Tutorials
2. Verify pageId matches in definition and component
3. Ensure DOM element IDs exist
4. Check browser console for errors

Issue: Element not highlighted
Fix:
1. Verify element ID in targetElement matches DOM
2. Check if element is visible/mounted
3. Try different position values
4. Check z-index conflicts

Issue: Tutorial appears on every visit
Fix:
1. Browser might not support localStorage
2. Try clearing browser cache
3. Check console for localStorage errors
4. Verify TutorialProvider in main.tsx

Issue: Focus/keyboard not working
Fix:
1. Ensure TutorialOverlay is in App.tsx
2. Check z-index of overlay (should be high)
3. Verify keyboard event listeners attached
4. Test with different browsers


11. PERFORMANCE OPTIMIZATION
============================

Current:
────────
- Lazy loading: Tutorial only renders when active
- Memoization: Definitions are static
- localStorage: ~200 bytes per user
- No impact on page load (context + overlay minimal)

Future Optimizations:
─────────────────────
- Code-split tutorial definitions
- Service worker caching
- IndexedDB for complex tutorials
- Analytics tracking


12. ACCESSIBILITY
=================

Implemented:
────────────
✓ Full keyboard navigation
✓ ARIA labels (role="dialog", aria-labelledby)
✓ High contrast colors
✓ Focus management
✓ Screen reader support
✓ Semantic HTML

Example ARIA:
─────────────
<div role="dialog" aria-labelledby="tutorial-title">
  <h2 id="tutorial-title">Tutorial Title</h2>
  <p>Tutorial content</p>
</div>


13. VERSIONING
==============

Current: 1.0
Available Features:
- ✓ Step-by-step tutorials
- ✓ Spotlight effect
- ✓ Keyboard navigation
- ✓ localStorage persistence
- ✓ Responsive design
- ✓ Theme support

Planned: 2.0
- □ Video integration
- □ Interactive "try it" steps
- □ Tutorial branching
- □ Analytics
- □ Multi-language
- □ Tour builder UI


14. RESOURCES
=============

Documentation:
- TUTORIAL_SYSTEM.md         - Full reference
- TUTORIAL_IMPLEMENTATION.md - Implementation details
- This guide                 - Integration & architecture

Files to Reference:
- src/contexts/TutorialContext.tsx         - Source of truth
- src/utils/tutorialDefinitions.ts        - All tutorials
- src/pages/party/KaraokeSongBrowserPage.tsx - Working example

"""
