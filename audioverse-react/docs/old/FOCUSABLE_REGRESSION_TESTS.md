# 🎮 Focusable Regression Testing Guide

## Overview

This document provides comprehensive regression testing guidelines for the Focusable spatial navigation system integrated across the AudioVerse application. The Focusable component enables gamepad/keyboard navigation using directional controls (up/down/left/right).

**Component**: `src/components/common/Focusable.tsx`
**Context**: `src/contexts/GamepadNavigationContext.tsx`
**Hook**: `src/components/common/useFocusableLayout.ts`

---

## 🎯 Testing Scope

**Total Pages Tested**: 39 pages
**Total Focusable Elements**: 100+ elements across application
**Navigation Methods**: 
- Gamepad (directional buttons)
- Keyboard (arrow keys)
- Mouse (click to focus)
- Tab navigation

---

## 📋 Pages Requiring Regression Testing

### 🔐 Authentication Pages (4 pages)

#### 1. LoginPage (`src/pages/auth/LoginPage.tsx`)
**Focusable Elements:**
- Email/username input field
- Password input field
- Login button
- "Forgot Password?" link
- Sign up link
- CAPTCHA component (if present)

**Test Cases:**
```
TC-AUTH-001: Navigate between email → password → submit using arrow keys
  Steps: Click email input → Press DOWN → Focus on password → Press DOWN → Focus on button
  Expected: Focus moves smoothly, visual indicator shows active element
  
TC-AUTH-002: Spatial navigation (left/right) should have no effect on vertical list
  Steps: Press RIGHT arrow multiple times on email field
  Expected: Focus remains on email field
  
TC-AUTH-003: Tab navigation must work consistently with Focusable system
  Steps: Press TAB on email field → TAB on password → TAB on button
  Expected: Focus order matches visual layout, no skip or loop
  
TC-AUTH-004: Mouse click sets focus correctly
  Steps: Click password field directly
  Expected: Password field becomes active, visual indicator updates
  
TC-AUTH-005: CAPTCHA doesn't break focus management
  Steps: Navigate to email → DOWN to password → DOWN to CAPTCHA (if present)
  Expected: CAPTCHA integration doesn't break focus chain
```

**Edge Cases:**
- CAPTCHA conflict (native vs reCAPTCHA v3) may affect focus
- Form submission with incomplete fields
- Password visibility toggle interaction

---

#### 2. FirstLoginPasswordChangePage (`src/pages/auth/FirstLoginPasswordChangePage.tsx`)
**Focusable Elements:**
- Current password input
- New password input
- Confirm password input
- Password strength indicator
- Submit button
- Password requirements list (interactive)

**Test Cases:**
```
TC-AUTH-201: Multi-field navigation on password change form
  Steps: Navigate through all 4 password fields sequentially
  Expected: Each field becomes active, focus indicator visible, no resets
  
TC-AUTH-202: Password strength indicator interaction during focus
  Steps: Focus on new password field, type password
  Expected: Strength indicator updates, focus remains on field
  
TC-AUTH-203: Password requirements list navigation (if focusable)
  Steps: Focus on password field → DOWN arrows to requirements
  Expected: Requirements visible and accessible via navigation
```

**Edge Cases:**
- Password typing while focused
- Strength meter visual updates
- Requirements validation during navigation
- Keyboard input vs arrow key handling

---

#### 3. ChangePasswordPage (`src/pages/auth/ChangePasswordPage.tsx`)
**Focusable Elements:**
- Current password input
- New password input
- Confirm password input
- Focusable current password input
- Submit button
- Cancel button

**Test Cases:**
```
TC-AUTH-301: Two-column password form layout navigation
  Steps: Navigate current password field → LEFT/RIGHT to new/confirm columns
  Expected: Spatial navigation works with multi-column layout
  
TC-AUTH-302: Submit/Cancel button navigation
  Steps: Complete password fields → DOWN arrow to buttons
  Expected: Both buttons focusable, can navigate between them (LEFT/RIGHT)
```

**Edge Cases:**
- Layout changes on small screens (mobile focus)
- Button placement in different viewport sizes
- Form validation blocking navigation

---

#### 4. RegisterPage (`src/pages/RegisterPage.tsx`)
**Focusable Elements:**
- Username input
- Email input
- Password input
- Confirm password input
- Terms checkbox
- CAPTCHA
- Register button

**Test Cases:**
```
TC-AUTH-401: Complex multi-field registration form
  Steps: Navigate through all 7 fields in order
  Expected: Smooth navigation, no focus loops, clear visual indicators
  
TC-AUTH-402: Checkbox navigation
  Steps: Navigate to terms checkbox
  Expected: Checkbox becomes focusable, can be toggled via SPACE key
  
TC-AUTH-403: CAPTCHA in complex form
  Steps: Navigate through form to CAPTCHA
  Expected: CAPTCHA doesn't break focus chain, can be verified
```

**Edge Cases:**
- Validation errors during navigation
- CAPTCHA verification flow
- Long form with many fields

---

### 👤 Profile Pages (4 pages)

#### 5. ProfilePage (`src/pages/profile/ProfilePage.tsx`)
**Focusable Elements:**
- User avatar/image
- User info fields
- Edit profile button
- Change password button
- Logout button
- Delete account button (if present)

**Test Cases:**
```
TC-PROF-001: Profile page main navigation
  Steps: Gamepad UP/DOWN through all 6 buttons vertically
  Expected: Clear focus order, buttons activate properly
  
TC-PROF-002: Avatar as focusable element
  Steps: Navigate to avatar element
  Expected: Avatar shows focus indicator, doesn't break layout
  
TC-PROF-003: Multiple button row navigation
  Steps: Navigate with LEFT/RIGHT through button group
  Expected: Buttons align and focus changes appropriately
```

**Edge Cases:**
- Avatar image loading delays
- Long username text wrapping
- Mobile layout (stacked buttons)

---

#### 6. PlayerPage (`src/pages/profile/PlayerPage.tsx`)
**Focusable Elements:**
- Player name input (id: `PlayerPage-player-name`)
- Create button (id: `PlayerPage-create-btn`)
- Player list items (if any)
- Edit/Delete buttons per player

**Test Cases:**
```
TC-PROF-201: Player management page
  Steps: Navigate player name input → create button
  Expected: Both Focusable elements register and respond to input
  
TC-PROF-202: List items with individual action buttons
  Steps: Navigate through list items
  Expected: Each item's edit/delete buttons are focusable and distinct
```

**Edge Cases:**
- Empty player list
- Multiple players in list
- Player creation while navigating

---

#### 7. PartyPage (`src/pages/profile/PartyPage.tsx`)
**Focusable Elements:**
- Party name input (id: `PartyPage-party-name`)
- Organizer ID input (id: `PartyPage-organizer-id`)
- Create button (id: `PartyPage-create-btn`)
- Add player buttons per party (id: `PartyPage-add-player-btn-{id}`)
- Party list items

**Test Cases:**
```
TC-PROF-301: Party creation form
  Steps: Navigate party name → organizer ID → create button
  Expected: All three fields focusable, clear focus progression
  
TC-PROF-302: Multiple parties in list
  Steps: Navigate through party list items
  Expected: Each party's "add player" button has unique ID and is focusable
  
TC-PROF-303: Dynamic ID handling
  Steps: Add new party → Navigate to its button
  Expected: New party's button registers correctly with unique ID
```

**Edge Cases:**
- Duplicate party IDs
- Real-time party list updates
- Button ID generation consistency

---

#### 8. ChangePasswordPage (Profile) (`src/pages/profile/ChangePasswordPage.tsx`)
**Focusable Elements:**
- Current password input (id: `ChangePasswordPage-current-password`)
- New password input
- Confirm password input
- Password strength indicator
- Submit button
- Cancel button

**Test Cases:**
```
TC-PROF-401: Password change form layout
  Steps: Refer to TC-AUTH-301 (same form, different page)
  Expected: Same behavior and focus management
```

---

### ⚙️ Settings Pages (4 pages)

#### 9. SettingsPage (`src/pages/settings/SettingsPage.tsx`)
**Focusable Elements:**
- Settings menu items (left sidebar)
- Settings categories buttons
- Navigation buttons between categories

**Test Cases:**
```
TC-SET-001: Settings sidebar navigation
  Steps: Navigate UP/DOWN through menu items
  Expected: Clear vertical focus progression through categories
  
TC-SET-002: Category switching via Focusable elements
  Steps: Click category button via gamepad
  Expected: New category loads, focus resets or maintains position
```

---

#### 10. DisplaySettingsPage (`src/pages/settings/DisplaySettingsPage.tsx`)
**Focusable Elements:**
- Theme selector buttons (dark/light/auto)
- Font size slider/buttons
- UI scale slider/buttons
- Apply/Save button

**Test Cases:**
```
TC-SET-101: Toggle button group navigation
  Steps: Navigate between theme buttons (UP/DOWN/LEFT/RIGHT)
  Expected: Active state updates, clear indication of selected theme
  
TC-SET-102: Slider/input interaction while focused
  Steps: Focus on font size slider → use arrow keys to adjust
  Expected: Slider responds to keyboard, maintains focus highlight
```

---

#### 11. AudioSettingsPage (`src/pages/settings/AudioSettingsPage.tsx`)
**Focusable Elements:**
- Audio input device selector
- Audio output device selector
- Volume controls
- Microphone test button
- Apply button

**Test Cases:**
```
TC-SET-201: Dropdown selector focus
  Steps: Focus on input device dropdown
  Expected: Dropdown shows as focused, can open with SPACE/ENTER
  
TC-SET-202: Volume slider navigation
  Steps: Navigate to volume slider
  Expected: Slider is focusable, responds to LEFT/RIGHT arrows
  
TC-SET-203: Microphone test while focused
  Steps: Focus on test button → press SPACE
  Expected: Test initiates, maintains focus throughout
```

---

#### 12. ControllerPage (`src/pages/settings/ControllerPage.tsx`)
**Focusable Elements:**
- Gamepad mapping visualization
- Button remapping inputs
- Axis calibration controls
- Preset selector buttons
- Reset button
- Save button

**Test Cases:**
```
TC-SET-301: Complex control mapping UI
  Steps: Navigate through all mapping controls
  Expected: Focus management survives complex, dynamic layout
  
TC-SET-302: Preset button group
  Steps: Navigate through preset buttons
  Expected: Can switch presets via LEFT/RIGHT arrows
  
TC-SET-303: Calibration control interaction
  Steps: Focus on axis control
  Expected: Can adjust with arrows without breaking focus
```

---

### 🔍 Explore Pages (2 pages)

#### 13. ExplorePage (`src/pages/explore/ExplorePage.tsx`)
**Focusable Elements:**
- Search input field
- Category filter buttons
- Song grid items (if focusable)
- Pagination/Load More button

**Test Cases:**
```
TC-EXP-001: Search and filter interaction
  Steps: Navigate search input → filter buttons
  Expected: Both interactive, focus switches smoothly
  
TC-EXP-002: Song grid spatial navigation
  Steps: Navigate song grid items
  Expected: Grid layout respected, focus moves in 2D pattern
```

---

#### 14. LibraryPage (`src/pages/explore/LibraryPage.tsx`)
**Focusable Elements:**
- Library item list
- Item action buttons (play, add, delete)
- Sort/filter controls

**Test Cases:**
```
TC-EXP-101: List item navigation with per-item actions
  Steps: Navigate through library items
  Expected: Each item's actions are distinct and focusable
```

---

### 🎵 Enjoy Pages (2 pages)

#### 15. EnjoyPage (`src/pages/enjoy/EnjoyPage.tsx`)
**Focusable Elements:**
- Playlist selector
- Play/Pause button
- Next/Previous buttons
- Volume control
- Shuffle/Repeat buttons

**Test Cases:**
```
TC-ENJ-001: Music player control navigation
  Steps: Navigate through all player controls
  Expected: All buttons focusable, focus order intuitive (play → next → volume etc.)
  
TC-ENJ-002: Playback control via gamepad
  Steps: Focus on play button → press button to toggle
  Expected: Music plays/pauses, focus remains
```

---

#### 16. MusicPlayerPage (`src/pages/enjoy/MusicPlayerPage.tsx`)
**Focusable Elements:**
- Track display
- Scrubber/timeline
- Play controls
- Volume
- Playlist view
- Shuffle/Repeat options

**Test Cases:**
```
TC-ENJ-101: Full player interface navigation
  Steps: Navigate complete player UI
  Expected: All elements reachable, focus doesn't get stuck
```

---

### 🎤 Party Pages (5 pages)

#### 17. PartiesPage (`src/pages/party/PartiesPage.tsx`)
**Focusable Elements:**
- Party list items
- Create party button
- Join party button per item
- Leave party button per item
- Delete party button per item

**Test Cases:**
```
TC-PAR-001: Party list item buttons
  Steps: Navigate through party list
  Expected: Each party's buttons are focusable and distinct
  
TC-PAR-002: Multiple actions per item
  Steps: Navigate to party → switch between Join/Leave/Delete buttons
  Expected: All three buttons focusable, no focus loss
```

---

#### 18. KaraokeSongBrowserPage (`src/pages/party/KaraokeSongBrowserPage.tsx`)
**Focusable Elements:**
- Search input
- Filter buttons (genre, difficulty, language)
- Song results list items
- Add to party button per song
- Tutorial overlay (if present)

**Test Cases:**
```
TC-PAR-101: Song browser with filters
  Steps: Navigate search → filters → song list
  Expected: Multi-stage navigation works, focus clear at each step
  
TC-PAR-102: Song list with per-item actions
  Steps: Navigate through song items
  Expected: Each song's "Add to party" button is distinct
  
TC-PAR-103: Tutorial overlay integration
  Steps: Tutorial overlay present → navigate page
  Expected: Tutorial doesn't break focus chain, overlay interactive if needed
```

---

#### 19. KaraokeRoundPage (`src/pages/party/KaraokeRoundPage.tsx`)
**Focusable Elements:**
- Current song display
- Lyrics display area
- Singer controls (start, skip, mark complete)
- Next singer button
- Results display
- End round button

**Test Cases:**
```
TC-PAR-201: Round management controls
  Steps: Navigate through round controls during active singing
  Expected: Controls responsive despite active playback
  
TC-PAR-202: Transition controls during round
  Steps: Navigate to "Next Singer" button → activate
  Expected: Round updates, focus management survives transition
```

**Edge Cases:**
- Active audio playback during navigation
- Rapidly changing song data
- Multiple singers in queue

---

#### 20. KaraokePlaylistPage (`src/pages/party/KaraokePlaylistPage.tsx`)
**Focusable Elements:**
- Playlist items
- Reorder buttons (up/down)
- Remove song buttons
- Clear playlist button

**Test Cases:**
```
TC-PAR-301: Playlist item manipulation
  Steps: Navigate playlist → select reorder buttons
  Expected: Items move, focus follows or remains stable
  
TC-PAR-302: Bulk operations
  Steps: Navigate to clear button → confirm
  Expected: Playlist empties, focus redirects to appropriate element
```

---

#### 21. DancePage (`src/pages/party/DancePage.tsx`)
**Focusable Elements:**
- Dancer display
- Choreography controls
- Camera controls
- Scene controls
- End dance button

**Test Cases:**
```
TC-PAR-401: Dance scene navigation
  Steps: Navigate through dancer display and controls
  Expected: Complex UI doesn't overwhelm focus system
  
TC-PAR-402: Choreography control responsiveness
  Steps: Apply choreography changes while focused
  Expected: Changes apply without losing focus
```

---

### 🛠️ Create Pages (4 pages)

#### 22. CreatePage (`src/pages/create/CreatePage.tsx`)
**Focusable Elements:**
- Create type selector buttons (audio/video/dmx)
- Project list items
- New project button
- Edit/Delete buttons per project

**Test Cases:**
```
TC-CRE-001: Type selection buttons
  Steps: Navigate between create type options
  Expected: Clear selection indication, focus switches properly
```

---

#### 23. AudioEditorPage (`src/pages/create/AudioEditorPage.tsx`)
**Focusable Elements:**
- Timeline scrubber
- Layer list items
- Add layer button
- Play/Stop buttons
- Mute/Solo buttons per layer
- Delete layer buttons
- Export button

**Test Cases:**
```
TC-CRE-101: Complex audio editor navigation
  Steps: Navigate through editor controls
  Expected: All elements reachable despite complex layout
  
TC-CRE-102: Layer manipulation while editing
  Steps: Focus on layer → mute button
  Expected: Per-layer controls work correctly
  
TC-CRE-103: Timeline interaction
  Steps: Navigate to timeline scrubber
  Expected: Can drag or click to seek
```

**Edge Cases:**
- Many layers in project (scroll + focus)
- Playback during navigation
- Real-time waveform rendering

---

#### 24. ProjectsPage (`src/pages/create/ProjectsPage.tsx`)
**Focusable Elements:**
- Project list items
- Edit buttons per project
- Delete buttons per project
- Create new project button
- Upload button

**Test Cases:**
```
TC-CRE-201: Project list navigation
  Steps: Navigate project items
  Expected: Each project's edit/delete buttons distinct
```

---

#### 25. DmxEditorPage (Create) (`src/pages/create/DmxEditorPage.tsx`)
**Focusable Elements:**
- Fixture list
- Fixture color picker
- Intensity slider
- Channel controls
- Save/Load buttons
- Cue list items

**Test Cases:**
```
TC-CRE-301: DMX control navigation
  Steps: Navigate fixtures → controls → save
  Expected: Complex control panel navigable
  
TC-CRE-302: Slider/picker interaction
  Steps: Focus on color picker
  Expected: Can adjust color with arrow keys
```

---

#### 26. AnimatedPersonsPage (`src/pages/create/AnimatedPersonsPage.tsx`)
**Focusable Elements:**
- Character list items
- Create character button
- Edit buttons per character
- Delete buttons
- Preview button
- Play choreography button

**Test Cases:**
```
TC-CRE-401: Animated character management
  Steps: Navigate character list
  Expected: All character controls accessible
```

---

### 👨‍💼 Admin Pages (6 pages)

#### 27. AdminDashboard (`src/pages/admin/AdminDashboard.tsx`)
**Focusable Elements:**
- Dashboard stats cards (if interactive)
- Admin menu sidebar
- Navigation to sub-sections

**Test Cases:**
```
TC-ADM-001: Admin dashboard navigation
  Steps: Navigate stats and menu
  Expected: Clear focus progression
```

---

#### 28. AdminUsersPage (`src/pages/admin/AdminUsersPage.tsx`)
**Focusable Elements:**
- User list items
- Edit buttons per user
- Delete buttons
- Create user button
- Filter/search input

**Test Cases:**
```
TC-ADM-101: User list management
  Steps: Navigate user items
  Expected: Each user's actions distinct and focusable
```

---

#### 29. AdminAuditDashboard (`src/pages/admin/AdminAuditDashboard.tsx`)
**Focusable Elements:**
- Audit log table rows (if focusable)
- Filter controls
- Export button
- View details buttons

**Test Cases:**
```
TC-ADM-201: Audit log navigation
  Steps: Navigate logs and controls
  Expected: Focus system handles large tables gracefully
```

---

#### 30. AdminSettingsPage (`src/pages/admin/AdminSettingsPage.tsx`)
**Focusable Elements:**
- Settings options
- Value inputs/toggles
- Save button
- Reset button

**Test Cases:**
```
TC-ADM-301: Settings configuration
  Steps: Navigate and modify settings
  Expected: Changes apply without focus loss
```

---

#### 31. AdminPasswordRequirementsPage (`src/pages/admin/AdminPasswordRequirementsPage.tsx`)
**Focusable Elements:**
- Requirement toggles
- Minimum length input
- Save button
- Preview/test button

**Test Cases:**
```
TC-ADM-401: Password requirement editor
  Steps: Navigate toggles and inputs
  Expected: All controls interactive via navigation
```

---

#### 32. HoneyTokenDashboard (`src/pages/admin/HoneyTokenDashboard.tsx`)
**Focusable Elements:**
- Token list items
- View details button per token
- Revoke button per token
- Create token button
- Trigger button (for testing)

**Test Cases:**
```
TC-ADM-501: Honey token management
  Steps: Navigate token list
  Expected: Each token's actions accessible
```

---

### 📊 Dashboard Pages (3 pages)

#### 33. Dashboard (`src/pages/dashboard/Dashboard.tsx`)
**Focusable Elements:**
- Dashboard widgets
- Widget navigation buttons
- Settings icon per widget

**Test Cases:**
```
TC-DAS-001: Dashboard widget navigation
  Steps: Navigate through widgets
  Expected: All widgets and controls reachable
```

---

#### 34. SecurityDashboard (`src/pages/dashboard/SecurityDashboard.tsx`)
**Focusable Elements:**
- Security stat cards
- Active sessions list
- Revoke session buttons
- Change password button

**Test Cases:**
```
TC-DAS-101: Security settings navigation
  Steps: Navigate sessions and security controls
  Expected: Session revocation works while navigating
```

---

#### 35. MyAuditLogsPage (`src/pages/dashboard/MyAuditLogsPage.tsx`)
**Focusable Elements:**
- Audit log table rows
- Filter controls
- Export button
- View details button per entry

**Test Cases:**
```
TC-DAS-201: User audit log viewing
  Steps: Navigate logs and controls
  Expected: Can view/export logs via navigation
```

---

### 💡 DMX Pages (1 page)

#### 36. DmxEditorPage (DMX) (`src/pages/dmx/DmxEditorPage.tsx`)
**Focusable Elements:**
- Universe selector
- Channel sliders
- Fixture indicators
- Cue save/load buttons
- Blackout button

**Test Cases:**
```
TC-DMX-001: DMX live control navigation
  Steps: Navigate all DMX controls
  Expected: Real-time control responsive to navigation
```

---

### 🎮 Play Page (1 page)

#### 37. PlayPage (`src/pages/play/PlayPage.tsx`)
**Focusable Elements:**
- Game type selector
- Game controls
- Pause/Resume buttons
- Quit button
- Score display (if interactive)

**Test Cases:**
```
TC-PLY-001: Active game navigation
  Steps: Navigate game controls during active play
  Expected: Controls responsive, focus doesn't break game
```

---

### 🏠 Home & Main Pages (3 pages)

#### 38. HomePage (`src/pages/HomePage.tsx`)
**Focusable Elements:**
- Navigation menu items
- Featured content buttons
- Hero CTA buttons

**Test Cases:**
```
TC-HOM-001: Home page navigation
  Steps: Navigate menu and featured content
  Expected: Clear focus progression through page
```

---

#### 39. Other Main Pages (e.g., root pages)
**Test Cases:**
```
TC-HOM-101: Root page navigation
  Steps: Test main navigation structure
  Expected: All main routes accessible
```

---

## 🧪 Cross-Page Navigation Tests

### TC-CROSS-001: Navigation Flow
```
Steps:
1. Start on HomePage
2. Navigate to LoginPage
3. Login successfully
4. Navigate to ProfilePage
5. Navigate to SettingsPage
6. Navigate back to ProfilePage
7. Logout

Expected: Focus system maintains state during navigation, no focus traps
```

### TC-CROSS-002: Focus Restoration
```
Steps:
1. Navigate to page A
2. Focus element X
3. Navigate to page B
4. Return to page A
5. Check if focus restored or reset appropriately

Expected: Consistent behavior (either restored or reset to first element)
```

### TC-CROSS-003: Modal/Overlay Focus
```
Steps:
1. Navigate page normally
2. Modal opens (tutorial, confirmation, etc.)
3. Navigate modal controls
4. Close modal
5. Resume page navigation

Expected: Focus properly shifts to modal, then back to page
```

---

## 🚨 Critical Scenarios

### Focus Trap Prevention
```
Verify: No page leaves user unable to focus any element with navigation
Method: 
- Navigate UP/DOWN/LEFT/RIGHT on every focusable element
- Verify can always move focus somewhere
- Check circular navigation (wrapping) works or is disabled appropriately
```

### Dynamic Content Updates
```
Verify: Focus survives when page content updates
Scenario:
- List items added/removed
- Element position changes
- Element dimensions change
```

### Performance Under Load
```
Verify: Focus system responsive with many focusables
Test:
- Pages with 50+ focusable elements
- Rapid focus changes
- Continuous navigation input
```

---

## 📱 Responsive Design Verification

### Desktop (1920×1080)
```
Verify: All navigation works on large screens
- Focus indicators clearly visible
- Spatial navigation logical
```

### Tablet (768×1024)
```
Verify: Touch + navigation system works
- Buttons properly sized for touch
- Focus indicators work with hybrid input
```

### Mobile (320×480)
```
Verify: Navigation works on small screens
- Vertical list navigation primary
- Buttons stacked, focus vertical
- No horizontal scrolling issues with focus
```

---

## 🎮 Gamepad-Specific Tests

### TC-GAMEPAD-001: D-Pad Navigation
```
Test D-Pad (arrow buttons) on all pages
Expected: Each direction moves focus appropriately
```

### TC-GAMEPAD-002: Button Mapping Variations
```
Test with different gamepad mappings (configurable in ControllerPage)
Expected: Navigation still works with remapped controls
```

### TC-GAMEPAD-003: Multiple Gamepads
```
Test with 2+ gamepads connected
Expected: Only active gamepad controls focus (configured in context)
```

---

## ⌨️ Keyboard Alternative Tests

### TC-KEYBOARD-001: Arrow Key Navigation
```
Test arrow keys as alternative to gamepad
Expected: Arrow keys move focus in appropriate directions
```

### TC-KEYBOARD-002: Tab Navigation
```
Test TAB and SHIFT+TAB for sequential focus
Expected: Focus order sensible, no jumping
```

### TC-KEYBOARD-003: Spacebar/Enter Activation
```
Test SPACE and ENTER on focusable elements
Expected: Buttons activate, inputs don't capture key
```

---

## 🐛 Known Issues to Watch For

1. **CAPTCHA System**: Two implementations (native + reCAPTCHA v3)
   - May break focus chain on login/register pages
   - Needs verification during testing

2. **Modal/Overlay Stacking**: Tutorial system + other modals
   - Focus trap risk if multiple overlays open
   - Test focus restoration after closing

3. **Dynamic Lists**: Party/Player lists with real-time updates
   - New items might not register properly
   - Focus might jump when items added/removed

4. **Form Validation**: Error messages during navigation
   - May break focus if layout changes
   - Test with invalid inputs during nav

5. **Audio Playback**: Music player during navigation
   - Focus changes during playback shouldn't stop music
   - Test EnjoyPage during active play

---

## ✅ Test Execution Checklist

- [ ] All 39 pages tested
- [ ] All Focusable elements identified
- [ ] Basic navigation (UP/DOWN/LEFT/RIGHT) verified on each page
- [ ] Cross-page navigation verified
- [ ] Focus traps identified and logged
- [ ] Responsive design verified (desktop/tablet/mobile)
- [ ] Gamepad navigation verified
- [ ] Keyboard alternatives verified
- [ ] Known issues reassessed
- [ ] Edge cases tested
- [ ] Performance acceptable
- [ ] Documentation updated

---

## 📊 Test Results Template

```
Page: [Page Name]
Route: [src/pages/...]
Focusable Elements: [count]
Status: [PASS / FAIL]

Passed Tests:
- TC-XXX-001: ✅
- TC-XXX-002: ✅

Failed Tests:
- TC-XXX-003: ❌
  Issue: [Description]
  Severity: [Critical/High/Medium/Low]

Notes:
[Any additional observations]
```

---

## 🎯 Success Criteria

**Overall Pass Criteria:**
- [ ] 95%+ test cases pass
- [ ] 0 focus traps found
- [ ] Cross-page navigation works seamlessly
- [ ] No performance issues with navigation
- [ ] Focus indicators visible on all pages
- [ ] Gamepad, keyboard, and mouse input all work
- [ ] Responsive design verified

**Release Blocker Issues:**
- Focus trap on any page
- Focus system completely non-functional on any page
- Critical elements unreachable via navigation
- Performance degradation from focus updates

---

*Last Updated: January 27, 2026*
*Focusable Component Version: Current (from src/components/common)*
*Testing Framework: Manual (with automated tools for performance)*
