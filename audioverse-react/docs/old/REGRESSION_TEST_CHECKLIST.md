# ✅ Focusable Regression Test Checklist

Quick reference for manual testing of Focusable spatial navigation integration.

---

## 🚀 Pre-Test Setup

- [ ] Application running locally (`npm run dev`)
- [ ] Browser DevTools open (F12)
- [ ] Gamepad/Keyboard ready for testing
- [ ] Test environment documented (OS, browser, device)
- [ ] Baseline screenshots taken

---

## 🔐 Authentication (4 pages)

### LoginPage (`/auth/login`)
- [ ] Email field focusable
- [ ] Password field focusable via DOWN arrow
- [ ] Login button focusable via DOWN arrow
- [ ] LEFT/RIGHT arrows don't move focus vertically
- [ ] Tab navigation works
- [ ] Mouse click sets focus
- [ ] Focus indicator visible on all elements
- [ ] CAPTCHA (if present) doesn't break chain

**Notes:**
```
[Test date: ______]
[Tester: ______]
[Status: PASS / FAIL]
[Issues: ______]
```

---

### FirstLoginPasswordChangePage (`/auth/first-login-password-change`)
- [ ] Current password field focusable
- [ ] New password field focusable (DOWN)
- [ ] Confirm password field focusable (DOWN)
- [ ] Password strength meter doesn't break focus
- [ ] Submit button focusable
- [ ] Cancel button focusable
- [ ] Requirements list interactive (if applicable)

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### ChangePasswordPage (Auth) (`/auth/change-password`)
- [ ] Current password field focusable
- [ ] New password field focusable
- [ ] Confirm password field focusable
- [ ] Submit button focusable
- [ ] Cancel button focusable
- [ ] Two-column layout navigates correctly

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### RegisterPage (`/auth/register`)
- [ ] Username field focusable
- [ ] Email field focusable (DOWN)
- [ ] Password field focusable (DOWN)
- [ ] Confirm password field focusable (DOWN)
- [ ] Terms checkbox focusable (DOWN)
- [ ] CAPTCHA focusable (DOWN)
- [ ] Register button focusable (DOWN)
- [ ] All fields have clear focus indicators

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 👤 Profile (4 pages)

### ProfilePage (`/profile`)
- [ ] User avatar/image area focusable
- [ ] Edit profile button focusable
- [ ] Change password button focusable
- [ ] Logout button focusable
- [ ] Delete account button focusable (if present)
- [ ] Clear vertical navigation order
- [ ] Button placement logical

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### PlayerPage (`/profile/players`)
- [ ] Player name input focusable (id: `PlayerPage-player-name`)
- [ ] Create player button focusable (id: `PlayerPage-create-btn`)
- [ ] Player list items focusable (if list exists)
- [ ] Edit/Delete buttons per player focusable
- [ ] Focus order logical

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### PartyPage (`/profile/parties`)
- [ ] Party name input focusable (id: `PartyPage-party-name`)
- [ ] Organizer ID input focusable (id: `PartyPage-organizer-id`)
- [ ] Create party button focusable (id: `PartyPage-create-btn`)
- [ ] Party list items focusable
- [ ] Add player button per party focusable (id: `PartyPage-add-player-btn-{id}`)
- [ ] IDs are unique and correct

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### ChangePasswordPage (Profile) (`/profile/change-password`)
- [ ] Current password field focusable (id: `ChangePasswordPage-current-password`)
- [ ] New password field focusable
- [ ] Confirm password field focusable
- [ ] Password strength indicator visible during focus
- [ ] Submit button focusable
- [ ] Cancel button focusable
- [ ] Same layout as auth version works correctly

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## ⚙️ Settings (4 pages)

### SettingsPage (`/settings`)
- [ ] Menu items focusable
- [ ] UP/DOWN navigation through categories
- [ ] Category switching works
- [ ] Focus management on category change

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### DisplaySettingsPage (`/settings/display`)
- [ ] Theme buttons focusable (dark/light/auto)
- [ ] LEFT/RIGHT between theme options
- [ ] Font size control focusable
- [ ] UI scale control focusable
- [ ] Apply button focusable
- [ ] Changes apply without losing focus

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### AudioSettingsPage (`/settings/audio`)
- [ ] Input device dropdown focusable
- [ ] Output device dropdown focusable
- [ ] Volume slider focusable
- [ ] Microphone test button focusable
- [ ] Apply button focusable
- [ ] Dropdowns open/close with focus

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### ControllerPage (`/settings/controller`)
- [ ] Gamepad mapping display readable
- [ ] Button remapping inputs focusable
- [ ] Axis calibration controls focusable
- [ ] Preset selector buttons focusable
- [ ] Reset button focusable
- [ ] Save button focusable
- [ ] Complex layout doesn't break focus

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🔍 Explore (2 pages)

### ExplorePage (`/explore`)
- [ ] Search input focusable
- [ ] Category filter buttons focusable
- [ ] Song grid items focusable (if applicable)
- [ ] Pagination/Load More button focusable
- [ ] Spatial navigation works with grid

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### LibraryPage (`/explore/library`)
- [ ] Library items focusable
- [ ] Action buttons per item focusable
- [ ] Sort/filter controls focusable
- [ ] List navigation logical

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🎵 Enjoy (2 pages)

### EnjoyPage (`/enjoy`)
- [ ] Playlist selector focusable
- [ ] Play/Pause button focusable
- [ ] Next button focusable
- [ ] Previous button focusable
- [ ] Volume control focusable
- [ ] Shuffle button focusable
- [ ] Repeat button focusable
- [ ] Controls responsive during playback

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### MusicPlayerPage (`/enjoy/player`)
- [ ] Track display focusable
- [ ] Timeline scrubber focusable
- [ ] Play controls focusable
- [ ] Volume control focusable
- [ ] Playlist view focusable
- [ ] Shuffle/Repeat options focusable
- [ ] Full player responsive

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🎤 Party (5 pages)

### PartiesPage (`/party`)
- [ ] Party list items focusable
- [ ] Create party button focusable
- [ ] Join button per party focusable
- [ ] Leave button per party focusable
- [ ] Delete button per party focusable
- [ ] All buttons distinct and accessible

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### KaraokeSongBrowserPage (`/party/songs`)
- [ ] Search input focusable
- [ ] Filter buttons focusable
- [ ] Song results focusable
- [ ] Add to party button per song focusable
- [ ] Tutorial overlay (if present) doesn't break chain
- [ ] Smooth transition between sections

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### KaraokeRoundPage (`/party/round`)
- [ ] Current song display
- [ ] Singer controls focusable
- [ ] Start/Skip/Mark complete buttons work
- [ ] Next singer button focusable
- [ ] Results display interactive
- [ ] Controls responsive during singing

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### KaraokePlaylistPage (`/party/playlist`)
- [ ] Playlist items focusable
- [ ] Reorder up/down buttons focusable
- [ ] Remove song buttons focusable
- [ ] Clear playlist button focusable
- [ ] List updates reflect in focus system

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### DancePage (`/party/dance`)
- [ ] Dancer display interactive
- [ ] Choreography controls focusable
- [ ] Camera controls focusable
- [ ] Scene controls focusable
- [ ] End dance button focusable
- [ ] Complex UI doesn't overwhelm focus

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🛠️ Create (4 pages)

### CreatePage (`/create`)
- [ ] Create type buttons focusable (audio/video/dmx)
- [ ] Project list items focusable
- [ ] New project button focusable
- [ ] Edit button per project focusable
- [ ] Delete button per project focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### AudioEditorPage (`/create/audio`)
- [ ] Timeline scrubber focusable
- [ ] Layer list items focusable
- [ ] Add layer button focusable
- [ ] Play/Stop buttons focusable
- [ ] Mute/Solo buttons per layer focusable
- [ ] Delete layer buttons focusable
- [ ] Export button focusable
- [ ] Many layers (scroll) handled correctly

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### ProjectsPage (`/create/projects`)
- [ ] Project items focusable
- [ ] Edit buttons focusable
- [ ] Delete buttons focusable
- [ ] Create new button focusable
- [ ] Upload button focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### DmxEditorPage (Create) (`/create/dmx`)
- [ ] Fixture list focusable
- [ ] Color picker focusable
- [ ] Intensity slider focusable
- [ ] Channel controls focusable
- [ ] Save/Load buttons focusable
- [ ] Cue list items focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### AnimatedPersonsPage (`/create/animated-persons`)
- [ ] Character list focusable
- [ ] Create character button focusable
- [ ] Edit buttons focusable
- [ ] Delete buttons focusable
- [ ] Preview button focusable
- [ ] Play choreography button focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 👨‍💼 Admin (6 pages)

### AdminDashboard (`/admin`)
- [ ] Dashboard stats interactive (if applicable)
- [ ] Menu sidebar focusable
- [ ] Navigation items accessible

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### AdminUsersPage (`/admin/users`)
- [ ] User list items focusable
- [ ] Edit buttons focusable
- [ ] Delete buttons focusable
- [ ] Create user button focusable
- [ ] Filter/search input focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### AdminAuditDashboard (`/admin/audit`)
- [ ] Audit log rows focusable (if applicable)
- [ ] Filter controls focusable
- [ ] Export button focusable
- [ ] View details buttons focusable
- [ ] Large tables handled gracefully

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### AdminSettingsPage (`/admin/settings`)
- [ ] Settings options focusable
- [ ] Value inputs focusable
- [ ] Save button focusable
- [ ] Reset button focusable
- [ ] Changes apply without focus loss

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### AdminPasswordRequirementsPage (`/admin/password-requirements`)
- [ ] Requirement toggles focusable
- [ ] Minimum length input focusable
- [ ] Save button focusable
- [ ] Test button focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### HoneyTokenDashboard (`/admin/honey-tokens`)
- [ ] Token list items focusable
- [ ] View details buttons focusable
- [ ] Revoke buttons focusable
- [ ] Create token button focusable
- [ ] Trigger button focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 📊 Dashboard (3 pages)

### Dashboard (`/dashboard`)
- [ ] Dashboard widgets focusable
- [ ] Widget navigation buttons focusable
- [ ] Settings icon per widget focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### SecurityDashboard (`/dashboard/security`)
- [ ] Security stat cards visible
- [ ] Active sessions list focusable
- [ ] Revoke session buttons focusable
- [ ] Change password button focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

### MyAuditLogsPage (`/dashboard/audit-logs`)
- [ ] Audit log table focusable
- [ ] Filter controls focusable
- [ ] Export button focusable
- [ ] View details buttons focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 💡 DMX (1 page)

### DmxEditorPage (DMX) (`/dmx`)
- [ ] Universe selector focusable
- [ ] Channel sliders focusable
- [ ] Fixture indicators interactive
- [ ] Cue save/load buttons focusable
- [ ] Blackout button focusable
- [ ] Real-time control responsive

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🎮 Play (1 page)

### PlayPage (`/play`)
- [ ] Game type selector focusable
- [ ] Game controls focusable
- [ ] Pause/Resume buttons focusable
- [ ] Quit button focusable
- [ ] Score display interactive (if applicable)
- [ ] Focus doesn't break during active game

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🏠 Home (3 pages)

### HomePage (`/`)
- [ ] Navigation menu items focusable
- [ ] Featured content buttons focusable
- [ ] Hero CTA buttons focusable
- [ ] Clear navigation flow

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🔄 Cross-Page Navigation

- [ ] HomePage → LoginPage → ProfilePage works
- [ ] ProfilePage → SettingsPage → DashboardPage works
- [ ] Party pages → Create pages works
- [ ] Admin pages navigation works
- [ ] Focus restoration on back navigation
- [ ] No focus traps between pages
- [ ] Modal overlays don't block navigation

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🎮 Input Method Testing

### Gamepad/Keyboard
- [ ] D-Pad/Arrow keys move focus
- [ ] Each direction (UP/DOWN/LEFT/RIGHT) works
- [ ] Diagonal movement not applicable
- [ ] Buttons activate on A/SPACE

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

### Mouse
- [ ] Click sets focus
- [ ] Focus indicator shows
- [ ] Hover state separate from focus state

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

### Tab Navigation
- [ ] TAB moves focus forward
- [ ] SHIFT+TAB moves backward
- [ ] Focus order logical
- [ ] Hidden elements not focusable

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 📱 Responsive Design

### Desktop (1920×1080)
- [ ] All elements properly sized
- [ ] Focus indicators visible
- [ ] Navigation logical
- [ ] No layout breaks

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

### Tablet (768×1024)
- [ ] Touch input works
- [ ] Buttons properly sized
- [ ] Focus indicators work
- [ ] Hybrid input (gamepad + touch) works

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

### Mobile (320×480)
- [ ] Vertical navigation primary
- [ ] Buttons stacked correctly
- [ ] No horizontal focus issues
- [ ] Touch targets adequate

**Notes:**
```
[Status: PASS / FAIL]
[Issues: ______]
```

---

## 🚨 Critical Issues

Found any focus traps or broken functionality? Document here:

### Issue 1
```
Page: ______
Element: ______
Issue: ______
Severity: CRITICAL / HIGH / MEDIUM / LOW
Reproducible: YES / NO
Steps to reproduce: ______
```

### Issue 2
```
Page: ______
Element: ______
Issue: ______
Severity: CRITICAL / HIGH / MEDIUM / LOW
Reproducible: YES / NO
Steps to reproduce: ______
```

---

## 📊 Summary

**Total Pages Tested:** 39
**Pages Passed:** ___/39
**Pages Failed:** ___/39

**Pass Rate:** ___%

**Critical Issues Found:** ___
**High Issues Found:** ___
**Medium Issues Found:** ___
**Low Issues Found:** ___

**Overall Status:** ☐ PASS ☐ FAIL

**Tested By:** ________________
**Test Date:** ________________
**Environment:** 
- OS: ________________
- Browser: ________________
- Device: ________________

**Sign-off:** ________________ (Date: ________)

---

*Use this checklist for each testing round*
*Mark completed pages with [X]*
*Document all issues found*
*Escalate critical issues immediately*
