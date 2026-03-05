# AudioVerse React — TODO

> Ostatnia aktualizacja: 2026-02-20 (help system ✅, display modes wiring ✅, party QR ✅, gradient colors ✅, alt animations ✅, session settings ✅, nav fixes ✅, font rendering ✅, playlist reorder ✅, multiplayer song selection ✅, karaoke editor ✅, song mini-games ✅, scoring tests ✅, tuning harness ✅, glossy bar renderer ✅, latency calibration ✅, CREPE AudioWorklet ✅, per-mic algorithm UI ✅, seamless textures ✅, gold bar patterns ✅, MIDI automation UI ✅, AI juror scoring ✅, mic settings audit ✅, metadata+Spotify lookup ✅, live transcription ✅, wiki docs 30 stron ✅, summary bars ✅, gamepad UX ✅, CarouselNav ✅, focus traps ✅)
> Build: PASS | TSX: ~480 komponentów | TS: ~345 modułów | Testy: 124 plików, 1581 PASS
> tsconfig: noUnusedLocals=true, noUnusedParameters=true

---
## POLISH
- [x] **Efekty przejścia** - po wejściu do śpiewania karaoke przejście - kurtyna na całą stronę z różnymi opcjami konfiguracji (brak, kurtyna do góry/w dół, kurtyna rozsuwana na boki, zaciemnienie - przejście przez czarny ekran), jeśli trzeba coś dorobić po stronie backendu, żeby zapisywać tą konfigurację per user, to trzeba to spisać w osobnym .md. Tych efektów można zrobić więcej - ze 20-30 na oko z podglądem. Fajnie by było jakby były ładne, dopracowane, wygenerowana kurtyna żeby wyglądała dostojnie (jakby się mogła zachowywać jak materiał, to też byłoby fajnie), żeby można jej było zmienić kolory podstawe i dodatkowe gdzieś w konfiguracji. Po summary to samo tylko w drugą stronę. W czasie gry nawigacja musi być ukryta a gra wyświetlana na całej wysokości strony. Powinien być też parametr w konfiguracji gracza, czy odpalamy w trybie full screen przeglądarki jeśli się da. Nie
- [x] **Skalowanie punktów** - obliczyć na początku ile punktów za segment i ile za złote monety tak, żeby nie było szansy przekroczyć 10000 punktów - to jest idealny wynik, który nigdy nie powinien być przekraczany. Zrobimy jeszcze bonusowe punkty za jakieś combo itd. ale podstawowa punktacja zostaje niezmienna
- [x] **Opcja bez złotych** - możliwość wyłączenia w konfiguracji gracza, żeby nie były liczone. Maks to dalej 10k, trzeba po prostu inaczej skalować punkty
- [x] **Dodatkowe informacje i filtry o piosenkach** - Obsłużyć FRONT.md - wykorzystać dodatkowe informacje w filtrach do piosenek i przede wszystkim coś z tych informacji wyświetlić, np. gatunek chociaż na piosence
- [x] **HomePage** - wywalić Features na jakiś osobny page, np. do dropdown pomocy. Zrobić porządny homepage z informacjami, newsami, najnowszymi imprezami. Coś takiego już ciekawszego z wykorzystaniem jakiś danych z bazy, żeby tchnąć w to trochę życia. Coś się może ruszać.

- [x] **Kampania Karaoke** - sesja karaoke, w której kolejne rundy trzeba odblokowywać osiągając odpowiedni pułap punktów . Jeden gracz może mieć więcej niż 1 kampanię. Różne warianty kampanii, z możliwością tworzenia nowych i edytowania, konfigurowania jakiś parametrów, ale ścieżek do wyboru. Może co jakiś czas w nagrode skille. Kampanie można grać wspólnie w kilku graczy w różnych trybach np. że wszyscy muszą zaliczyć pułap (liczy się najniższy), albo chociaż jeden (liczy się najwyższy). W kampanii można ustawić tryb śpiewania (na oślep etc.) dla każdej rundy i piosenki do wybierania
- [x] **Postęp** - XP, poziomy, w kategorii karaoke, honest-living etc. per gracz. XP zdobywane w karaoke w kampanii i poza. Skille do kampanii i poza kampanię. Np. do kampanii - dodatkowa piosenka do wyboru.

- [x] **Summary** - dopieścić, niech animują się bary (jak z timeline w kolorze gracza z punktacją, która się wypełnia od 0 do 10000 punktów max) a za nim kolejny z bonusowymi punktami tylko w nieco jaśniejszym kolorze - niech są na siebie nałożone (classic points na wierzchu). Niech animacja trwa 5s dla 10k (przy wyniku 10k, jak krócej to proporcjonalnie krócej) classic points i dla bonus odpowiednio proporcjonalnie dłużej (dla tej różnicy tylko). Ułożenie graczy w kolejności i zestawienie z lokalnym i globalnym rankingiem top 10 i zaznaczonymi graczami w swoich kolorach, jeśli się dostali ✅ `KaraokeSummaryOverlay.tsx` rewrite: animated ScoreBar (rAF, ease-out cubic, proportional duration), classic+bonus overlay, RankingSection (local+global top 10), medals, lightenColor(), multi-player `PlayerScoreEntry[]`, `useKaraokeManager` perPlayerScores

- [x] **Gamepad friendly** - upewnić się, czy cała aplikacja jest przyjazna padom i strzałek, czy wszędzie można wejść padem/enterem, wszystko wybrać. UX przy tym musi być niezrównany. ✅ scrollIntoView on focus, input/select activation in confirm handler, `useModalFocusTrap` hook (reusable), Focusable on 10+ pages (Home, Settings, Controller, Display, Campaigns, CampaignDetail, Play, Party, Playlists, Player), focus traps on modals 
- [x] **Karuzela dla pada** - listy takie jak piosenki karaoke, playlisty (w widoku 1 pane), listy piosenek, seriali etc. powinny mieć nawigację na zasadzie karuzel np. dla piosenek karaoke ✅ `CarouselNav.tsx` (~270 linii): scroll-snap carousel, hierarchical drill-down with breadcrumbs, Focusable cards with scale highlight, edge arrows, configurable visibleCount/cardHeight. Integrated in `KaraokeSongBrowser.tsx` — genre/year/language filter categories

- [x] **Zaktualizować wiki i testy** - dodać ostatnie zmiany ✅ GAMEPAD_NAVIGATION.md updated (Recent Changes section), CarouselNav.test.tsx (13 tests), KaraokeSummaryOverlay.test.tsx (10 tests)
- [x] **Zweryfikować tłumaczenia** - Wszystkie 7 języków mają po 140 kluczy (EN, PL, DE, ES, FR, JA, ZH). 27 brakujących grup uzupełniono, pliki bez BOM. Szybki sweep: brak istotnych hardcodów.

## 🔴 KRYTYCZNE (blokujące / bezpieczeństwo)

### Bezpieczeństwo
- [x] **XSS w BggSearchPanel** — `dangerouslySetInnerHTML` + DOMPurify.sanitize() ✅
- [x] **Tokeny w localStorage** — refresh token przeniesiony do `httpOnly` cookie (`av_refresh_token`); access token pozostaje w localStorage + pamięci; `apiUser.ts` nie przechowuje/wysyła refresh tokena; `audioverseApiClient.ts` z `withCredentials: true`; testy zaktualizowane ✅
- [x] **innerHTML w FontLoader** — zamienione na `textContent` ✅
- [x] **Brak Content Security Policy** — dodano CSP meta tag w `index.html` ✅
- [x] **Brak route guards** — dodano `RequireAuth` i `RequireAdmin` w `components/auth/RequireAuth.tsx`, owinięto admin i profile routes ✅

### Accessibility (a11y)
- [x] **ARIA coverage** — dodano `role="navigation"` + `aria-label` na Navbar, `role="main"` + `aria-label` na `<main>`, `role="img"` + `aria-label` na canvasach ✅
- [x] **Skip-navigation link** — dodano "Skip to main content" link z focus/blur show/hide ✅
- [x] **Canvas karaoke/timeline** — dodano `role="img"` + `aria-label` na KaraokeTimeline i PadKaraokeOverlay ✅
- [x] **Focus management przy zmianie route** — dodano `ScrollToTop` component (scroll + focus na `<main>`) ✅
- [x] **Focusable: `<div tabIndex={0}>`** — dodano domyślny `role="group"` w komponencie `Focusable.tsx`, obejmuje ~50 użyć; poszczególne miejsca mogą nadać `role="button"`/`"menuitem"` wg potrzeby ✅

### Gamepad / Nawigacja
- [x] Nawigacja padem — infrastruktura zaimplementowana: GamepadNavigationContext z spatial navigation, focus traps (pushFocusTrap/popFocusTrap), dropdown items, D-pad + analog + confirm/cancel, keyboard arrows fallback ✅
- [x] Kliknięcie/spacja do aktywacji AudioContext — `AudioActivationOverlay` (click/space/gamepad), `resumeAudioContext()` w GenericPlayer.play(), overlay w GenericPlayer gdy autoPlay && !audioReady ✅
- [x] Odliczanie 3...2...1... po znalezieniu a przed puszczeniem YT — `CountdownOverlay` + `countdownSeconds` prop w GenericPlayer, MusicPlayerPage używa `countdownSeconds={3}` ✅
- [x] KaraokeSongBrowser — naprawiono: blokada nawigacji do `/rounds` gdy `playersLoading === true`, toast informujący o ładowaniu danych gracza ✅
- [x] Klikanie dropdownów — zaimplementowano delayed close (200ms timeout), gamepad toggle cooldown (600ms), close event z B-button, keyboard cooldown ✅
- [x] Focusable — 5 trybów highlight: outline (default), dim, brighten, glow, scale — CSS w GamepadFocusStyle.css, prop `highlightMode` w Focusable.tsx ✅

---

## 🟡 WAŻNE (architektura / jakość kodu)

### Dekompozycja wielkich plików
- [x] **AudioEditor.tsx (2248→252 linii)** — wyodrębniono: `useAudioEditor` hook (1016 linii), `ProjectPanel`, `SectionPanel`, `AdvancedEditingPanel`, `ClipOperationsPanel`, `LayerTrack` w `panels/` + istniejące `EditorPanels.tsx` (AutoSave, UndoRedo, ZoomSnap, MasterFX, Recording) ✅
- [x] **KaraokeManager.tsx (1414→342 linii)** — wyodrębniono: `useKaraokeManager` hook (970 linii) z całą logiką, manager jako czysty layout ✅
- [x] **Game.tsx (2303→93 linii)** — wyodrębniono: `useGame` hook (2018 linii) z pełną logiką Phaser/combat/farming/multiplayer, wrapper jako czysty layout ✅
- [x] **apiKaraoke.ts (1696→3 linii barrel + 6 plików w `src/scripts/api/karaoke/`)** — rozbito na: `apiKaraokeBase.ts` (83), `apiKaraokeSessions.ts` (270), `apiKaraokeRounds.ts` (150), `apiKaraokeSongs.ts` (434), `apiKaraokePlayers.ts` (556), `index.ts` (59) ✅
- [x] **modelsKaraoke.ts (1608→5 linii barrel + 4 pliki w `src/models/karaoke/`)** — rozbito na: `modelsEvent.ts`, `modelsKaraokeCore.ts`, `modelsGames.ts`, `modelsCommon.ts`, `index.ts` ✅
- [x] **Navbar.tsx (669→257 linii)** — wyodrębniono: `useNavbarDropdowns` hook, `NavDropdownMenu` komponent, `navMenuItems` data — 7 dropdownów zastąpionych data-driven komponentem ✅
- [x] **PartyPage.tsx (868→402 linii)** — wyodrębniono: `usePartyPage` hook (530 linii) z całą logiką biznesową (stan, mutacje, efekty, computed), strona jako czysty layout ✅
- [x] **themes.ts (1349→6 plików w `src/themes/`)** — rozbito na: `themeTypes.ts`, `fullThemes.ts`, `seededThemes.ts`, `themeRegistry.ts`, `themeCatalog.ts`, `index.ts` ✅

### Routing
- [x] **Brak strony 404** — dodano `NotFoundPage` z catch-all `<Route path="*">` ✅
- [x] **Brak ProtectedRoute / AuthGuard** — dodano `RequireAuth` i `RequireAdmin` ✅
- [x] **Niespójne URL style** — ustandaryzowano na kebab-case: `/musicPlayer`→`/music-player`, `/dmxEditor`→`/dmx-editor`, `/settings/audioInput`→`/settings/audio-input` ✅
- [x] **Flat route list** — zrefaktoryzowano na `createBrowserRouter` z route objects: wyodrębniono `RootLayout` (Navbar, a11y, ErrorBoundary, loading), `AuthLayout` i `AdminLayout` (layout route guards z `<Outlet />`); wyeliminowano 24 powtarzające się wrappery `<RequireAuth>/<RequireAdmin>`; usunięto 53 `React.lazy` na rzecz natywnego `lazy` route property; `<BrowserRouter>` z main.tsx → `<RouterProvider>`; App.tsx: 204→113 linii ✅

### Porządki w kodzie
- [x] **Podwójny ContextProvider** — usunięto z `App.tsx` (zostaje tylko w `main.tsx`) ✅
- [x] **Pliki nie-kodowe w `src/`** — przeniesiono do `docs/` (lyrics .txt, BACKEND_NEW.md, TESTING.md, pitchy2ultrastar.txt, RTC.md) ✅
- [x] **`audioPlaybackEngine.bak`** — usunięto martwy plik `.bak` ✅
- [x] **Duplikat PaginationControls** — usunięto re-export z `components/controls/`, zostawiono `components/ui/` ✅
- [x] **Admin pages pod `components/`** — przeniesiono do `pages/admin/` + zaktualizowano importy w App.tsx ✅
- [x] **Skomentowane console.log** — usunięto ~50+ zakomentowanych console.log z 20 plików ✅
- [x] **Podwójne importy w apiAdmin.ts** — skonsolidowano w jeden blok importów + przywrócono OTP/HoneyToken endpoints ✅
- [x] **`@ts-nocheck` na Api.ts** — usunięto całkowicie 1779-liniowy plik Api.ts; wyekstrahowano typy bezpieczeństwa do `types/securityTypes.ts`, przeniesiono importy KaraokePlayer/KaraokePlaylistSong do `models/karaoke`, zrefaktoryzowano HoneyTokenDashboard na serwis ✅
- [x] Włączono `noUnusedLocals` i `noUnusedParameters` w tsconfig — naprawiono 247 błędów (247→0) ✅
- [x] **`any` w produkcyjnym kodzie** — otypowano `apiPartyAttractions.ts` (`Record<string, PartyAttraction[]>`); usunięto ~25 instancji `as any` z PlayPage, AdminScoringPresetsPage, Navbar, AdminSkinsPage, apiKaraokePlayers, GameSessionScoringPanel, PlaylistManagerPage, AudioInputDevice, TextTab; dodano 4th type param do useMutation (context), naprawiono CSS custom property casts, błędne field names (coverUrl/sourceId), poprawiono Monaco typings ✅
- [x] `apiPartyAttractions.ts` — dodano feature flag `VITE_USE_MOCK_ATTRACTIONS` (domyślnie mock/localStorage); dodano prawdziwe endpointy API (`/api/events/{id}/attractions`); przełączanie mock↔real przez env var ✅
- [x] **Zustand dependency** — zweryfikowano: używany wyłącznie w honest-living (5 stores: useGameStore, useInventoryStore, useModStore, useSettingsStore, useUIStore, useAssetLibrary); potrzebny, zostaje ✅
- [x] **WindiCSS dependency** — usunięto nieużywany `windicss` z devDependencies ✅

### CSS / Styling cleanup
- [x] **3+ frameworki CSS** — Bootstrap jest dominujący (252 plików + 18 react-bootstrap importów); Tailwind i DaisyUI były dodane ale niekonfigurowane (brak @import, brak config) → usunięto `tailwindcss` i `daisyui` z dependencies; zostawiono Bootstrap jako jedyny framework CSS ✅
- [x] **68 plików CSS bez konwencji nazewnictwa** — migrated 8 CSS files to CSS Modules (TutorialOverlay, KeyboardPad, partyNavbar, partyAlerts, permissionsPanel, AudioEditor×2, adminPasswordRequirements); deleted 8 old CSS files + orphaned karaokeCountdown.css; 6 files kept global (index, App, AppTheme, GamepadFocusStyle, loginForm, registrationForm); `:global()` for Bootstrap class overrides ✅
- [x] **Mieszane języki w komentarzach** — przetłumaczono ~250+ polskich komentarzy na angielski w ~60+ plikach źródłowych + 3 plikach testowych; obejmuje modele, komponenty, API, konteksty, hooki, strony, utils, serwisy ✅

---

## 🟢 TESTY

### Pokrycie testami (~14% plików)
- [x] **Testy stron** — PlayPage: 6 testów (rendering, linki, ikony, tytuły) ✅
- [x] **Testy context providerów** — ThemeContext: 7 testów (default, toggle, persist, DOM attrs); TutorialContext: 11 testów (start/next/prev/skip/complete/reset/persist/error-guard) ✅
- [x] **Testy hooków** — useSelection: 7 testów (toggle/set/clear/stability); useServiceWorker: 7 testów (online/offline/events) ✅
- [x] **Testy Navbar** — 10 testów: brand link, aria-label, theme/language picker, auth-conditional rendering (sign in/out, dropdowns), admin dropdown, password-change lockdown ✅
- [x] **Konsolidacja katalogów testowych** — przeniesiono 8 unikalnych plików z `__tests__/` i `tests/` do `src/__tests__/`, usunięto 4 duplikaty (pokryte obszerniejszymi testami w src), usunięto puste katalogi `__tests__/` i `tests/`, zaktualizowano `vitest.config.ts` ✅
- [x] **CI test run** — dodano stage `Test` w `azure-pipelines.yml`: Node 20, `npm ci`, `npm run build`, `npx vitest run`; uruchamia się przed Build, blokuje deploy przy niepowodzeniu testów ✅
- [x] E2E testy — dodano 4 nowe pliki spec (settings, pages-smoke, karaoke-editor-interaction, error-free-routes) z ~25+ testami: smoke tests na 17 route'ach, error-free checks (pageerror + status < 500), form controls, tab interactions, keyboard navigation (Tab focus, Escape no error) ✅
- [x] E2E testy — rozszerzono coverage: dodano routes-extended.spec.ts (19 tras), flows-extended.spec.ts (auth, playlist, party, settings, mini-games, editor), 14+ istniejących plików (~93 testy).

---

## 🎵 KARAOKE — funkcjonalność

### Timeline & Rendering
- [x] Canvas-based timeline per player (pojedynczy canvas z warstwami per player) — `karaokeTimeline.ts` (1037 linii), `KaraokeTimeline.tsx` (283 linii) ✅
- [x] Dla 1 gracza timeline 2x szerszy — `widthMultiplier = 2 / Math.max(1, playerCount)` w KaraokeTimeline.tsx ✅
- [x] Poprawić timeline — szare paski, złote nuty ciemnozłotym (#B8860B fill + #FFD700 stroke), trafienie = złoty border + hit flash ✅
- [x] Zaznaczać wokal na timeline w kolorze gracza, każdy gracz ma własny layer na jednym canvas — `playerBgColor` per-player rendering ✅
- [x] Upłynnić animację timeline — RAF loop z exponential smoothing (`panSmooth += (panTarget - panSmooth) * 0.12`) ✅
- [x] Lecąca kulka w kolorze gracza — musi lecieć cały czas — `drawBall()` z `playerBgColor` i ciągłym ruchem ✅
- [x] Kulka zamalowuje szare paski i zostawia ślad — paint trail z `globalAlpha` fading ✅
- [x] Animacja trafienia zależna od perfect/good/bad i złotych nut — accuracy-colored segments + hit flash overlay ✅
- [x] Particle effects, efekty, płynne przejścia — gold particle bursts (`drawParticles()`), smooth transitions ✅
- [x] Alternatywna animacja — 4 tryby (Ball & Trail, Wipe, Pulse, Bounce) wybieralne w ustawieniach `/settings/display` — `karaokeAnimations.ts` z strategy pattern, `animationMode` param w `drawTimeline()`, przekazywany przez `KaraokeTimeline.tsx` → `KaraokeManager.tsx` ✅
- [x] **Glossy bar renderer** — `glossyBarRenderer.ts` (822 linii): 24 funkcje cap shapes (12 typów × L/R: Pill, Sharp, Soft, Chamfer, Arrow, Shield, Bracket, Tab, Wave, Ornate, SkewTL, SkewTR), 3 rejestry (SYMMETRIC_CAPS 10, ASYMMETRIC_CAPS 20, SKEW_CAPS 10 = 40 stylów), 30 overlay patterns z `color2` support, `renderGlossyBarSvg()` i `drawGlossyBarOnCanvas()`, `patternOnly` mode (flat fill bez 3D), `PlayerBarStyle` interface z localStorage persistence ✅
- [x] **Integracja glossy bars w timeline** — `karaokeTimeline.ts` (968 linii): zastąpiono `create3dGradient + roundRect` rendering przez `drawGlossyBarOnCanvas` dla złotych nut, trafionych segmentów i pustych belek; `barStyle?: PlayerBarStyle` param w `drawTimeline()`, przekazywany przez `KaraokeTimeline.tsx` (272 linii) → `KaraokeManager.tsx` (useMemo + prop) ✅
- [x] **Bar style chooser w PlayerForm** — `PlayerForm.tsx` (450 linii): rozwijalna sekcja "Bar style" z wizualnym selectorem cap shapes (SVG preview grid), selectorem overlay patterns (30 + None), toggle patternOnly, picker patternColor (auto/custom), slidery highlight/glow/emptyGlass (0-100), reset to defaults; live preview w nagłówku sekcji; i18n (en+pl, 11 kluczy) ✅
- [x] **Seamless textures** — `textureCatalog.ts` (katalog 17 kategorii × 8–24 tekstur = ~280), `textureCache.ts` (async image loader + `CanvasPattern` cache z `DOMMatrix` skalowaniem), integracja z `drawGlossyBarOnCanvas()` i `renderGlossyBarSvg()`, osobne tekstury dla filled/empty barów, 5 presetów pustego bara (custom/maxGlass/wireframe/dimTexture/none), suwak skali tekstury, preload w `KaraokeManager.tsx` ✅
- [x] **Gold bar patterns & textures** — osobne patterny/tekstury dla złotych nut (unhit + hit), domyślnie Stars pattern, konfigurowalne kolory patternów, texture pickers w PlayerForm w rozwijalnej sekcji "⭐ Gold bar style" ✅
- [x] **Per-player bar style** — `loadPlayerBarStyle(playerId?)` / `savePlayerBarStyle(style, playerId?)` z klucze localStorage `audioverse-player-bar-style-{id}`, fallback do globalnego stylu; `loadPlayerBarStyles(ids)` ładuje mapę; `KaraokeManager` ładuje per-player i podaje `barStyle={playerBarStyles.get(p.id)}` do każdego `KaraokeTimeline`; `PlayerForm` ładuje/zapisuje styl per `selectedPlayerId`, reload przy zmianie gracza ✅

### Scoring (UltraStar rules)
- [x] Verify/finalize scoring — gold notes, segmentation scoring, difficulty presets zaimplementowane w `karaokeScoring.ts` ✅
- [x] Liczenie punktów przy trafieniu, aktualizacja na Canvas — `drawTimeline()` z live score/combo display ✅
- [x] Combo i bonusy za wersy, ocena wersów: Awful → Perfect — `getComboMultiplier()`, verse ratings (Awful/Poor/OK/Good/Great/Perfect) ✅
- [x] Ekran punktacji — `KaraokeSummaryOverlay.tsx` z top 10 leaderboard, player score, restart/continue ✅
- [x] AI jako noty od jurorów + pobieranie nagrania gracza — `scoreBus.push()` wired in `useKaraokeManager.ts` live scoring loop → animated Jurors react via `attachScoreReactions()`, nagrania per-player via `recordings` state ✅

### Lyrics & Sync
- [x] Poprawić synchronizację tekstu — `KaraokeLyrics.tsx` z syllable-by-syllable highlight, `clipPath: inset(0 ${100-pct}% 0 0)` sweep ✅
- [x] Zmiana koloru tekstu gradientowo — gradient sweep z blue→teal→gold, złote nuty z odrębnym gold styling ✅
- [x] Konfigurowalny kolor gradient w ustawieniach — `/settings/display` z 6 presetami (Cyan→Yellow→Amber, Neon Pink, Fire, Ocean, Forest, Retro) + custom picker, `karaokeDisplaySettings.ts` (localStorage + CSS vars), `DisplaySettingsPage.tsx` z live preview, init w `main.tsx` ✅

### Mikrofony & Audio
- [x] Dopiąć mikrofony do KaraokeRound — pauza gdy urządzenie zniknie — `useKaraokeManager.ts`: `micLostWarning` state, `devicechange` listener w `AudioContext.tsx`, auto-pause + warning UI + 300ms auto-resume po powrocie mikrofonu, 12s auto-dismiss ✅
- [x] Rejestrować wejścia per-player niezależnie, pobierać pliki po zakończeniu — `useKaraokeManager.ts`: `recordersRef` z osobnym `AudioRecorder` per player (keyed by playerId), `recordings: { [playerId]: Blob | null }`, po zakończeniu `<audio controls>` + download link `{player.name}-recording.webm` w `KaraokeManager.tsx` ✅
- [x] Oceniać każdy kanał przez porównanie z KaraokeSongFile + AI live — `scoreNotesWithPitchPoints()` compares live pitch against UltraStar notes per-player, `postSingingScore()` / `getSingingScoreLiveWsUrl()` API endpoints ready, `scoreBus` pushes results to juror animations ✅
- [x] `ws://localhost:5174/` — stale/obsolete; all WebSocket URLs now use API-relative paths (`getSingingScoreLiveWsUrl()`, `getPitchServerWsUrl()`, etc.) — no hardcoded localhost ✅
- [x] Ustawienia mikrofonu — brane pod uwagę w edytorze (`useAudioEditor` → `AudioRecorder` → `getUserMedia({ deviceId })`) i śpiewaniu (`useKaraokeManager` → `audioInputs`, `micId` per player, mic-lost pause/resume) ✅
- [x] **Audyt ustawień mikrofonu** — zweryfikowano wszystkie per-device settings; naprawiono 7 martwych parametrów: `micGain` (GainNode w audio chain), `monitorEnabled`/`monitorVolume` (odsłuch przez głośniki), `pitchThreshold` (konfigurowalna clarity zamiast hardcoded 0.6), `smoothingWindow` (rolling average bufor), `hysteresisFrames` (N cichych ramek przed zerowaniem), `useHanning` (okno Hanninga). Dodano 7 nowych map stanów w `GameContext.tsx`, rozszerzono `RecorderStartOptions` w `recording.ts`, wdrożono pełny pipeline w `useKaraokeManager.ts` (`startLocalPitch` 11 parametrów + smoothing buffer + hysteresis counter) ✅
- [x] **Transkrypcja AI na żywo** — co 10s podczas śpiewania: przechwytywanie 2s audio chunk z MediaRecorder → `POST /api/ai/audio/asr` → porównanie z oczekiwanym tekstem (UltraStar notes w oknie czasowym) → floating badge 🎤 XX% (zielony ≥70%, żółty ≥40%, czerwony <40%), opacity 0.7; `transcriptionMatches` state (ostatnie 10 wyników) ✅
- [x] Phaser w KaraokeManager? — intentional design: KaraokeManager uses Canvas 2D (`karaokeTimeline.ts`); Phaser is only in `KaraokePhaserRenderer` (ExportTab preview) and `hitThatNote.ts` (mini-game). No KaraokeManager change needed ✅

### Latency & Calibration
- [x] Udoskonalić LatencyCalibrator: ScriptProcessorNode (sample-accurate) zamiast AnalyserNode polling (~20ms imprecyzji), 3-rundowa kalibracja z outlier trimming (odrzuca min/max, średnia ze środkowych), wyłączenie echo cancellation/noise suppression/AGC, progress bar + wyniki rund ✅
- [x] Zapisywanie `offsetMs` — `GameContext.tsx` ładuje z backendu (`MicrophoneDto.offsetMs`) z fallbackiem na localStorage (`mic_settings_{deviceId}`); `useKaraokeManager.ts` stosuje offset w `pushPitch()` (shift timestamp: `t - offsetMs/1000`), `startLocalPitch()` i `startStreamingPitch()` per-player ✅
- [x] Offset slider w TuningHarness — `TuningHarnessPage.tsx`: slider -500..+500 ms (step 5), `shiftedPoints` useMemo przesuwa `PitchPoint.t` o `offsetMs/1000`, stosowany w interactive scoring + preset sweep + heatmap pitch dots ✅
- [x] Auto-seed w harness — przycisk "Auto-find best offset" robi sweep -500..+500ms (coarse 10ms → fine 1ms) i ustawia offset max total

### Pitch Detection
- [x] Integracja CREPE via AudioWorklet z retry/backoff i fallbackami — `crepeStreaming.ts`: migracja z `ScriptProcessorNode` na `AudioWorkletNode('pitch-processor')` z automatycznym fallbackiem na `ScriptProcessorNode`; deduplikacja `start()`/`startWithMediaStream()` do wspólnego `handleAudioFrame()` + `setupAudioNodes()`; `onFallback` callback wywoływany po wyczerpaniu 10 prób reconnect WS; `useKaraokeManager.ts` automatycznie przełącza na lokalne pitchy po awarii CREPE WS; naprawiono zduplikowaną rejestrację klasy w `pitch-worklet.js` ✅
- [x] UI do wyboru algorytmu per-mikrofon z persistencją — `PlayerForm.tsx`: selektor algorytmu (autocorr/pitchy/crepe/librosa) widoczny przy edycji gracza; `GameContext.tsx`: `setMicAlgorithm()` zapisuje wybór do `localStorage(mic_settings_{deviceId})`, ładowanie algorytmu z backendu z fallbackiem na localStorage; i18n (en+pl, 5 kluczy) ✅

### Ustawienia gry
- [x] KaraokeSession entity — `KaraokeSession` interface w `modelsKaraokeCore.ts` (id, eventId, name, teamMode, rounds), `KaraokeSessionMode/SongPick/SongSignup` types, pełne API w `apiKaraokeSessions.ts` (create/fetch/mutate), integracja z events ✅
- [x] Motywy (kolory), czcionki, czas, ilość rund, tryby — kolory zrobione w `/settings/display`; **GameSettingsPanel** w tab "Games" na PartyPage z trybami (Classic/Blind/Elimination/Relay/Freestyle), max rund, czas/rundę, motyw kolorystyczny, czcionka, tło; **font rendering**: `fontFamily` w `KaraokeDisplaySettings`, selektor w `/settings/display`, `drawTimeline()` parametryzowany fontem (6 miejsc), `KaraokeLyrics` przez `--karaoke-font-family` CSS var ✅
- [x] Podpiąć KaraokeParties pod nawigację i porządek — routes w App.tsx (`/parties`, `/parties/:partyId`, `/rounds`, `/join`), navbar `socialItems`, PlayPage hub z kartami, breadcrumb w KaraokeRoundPage ✅

### Playlisty Karaoke
- [x] My Playlists / Online Playlists — nowe kategorie w drzewie Browser — `SongBrowserSidebar.tsx` z My Playlists (CRUD inline) + Online Playlists, `BrowserNode` type union, `KaraokeSongBrowser.tsx` obsługuje oba typy ✅
- [x] Tworzenie, udostępnianie, zapisywanie playlist karaoke — tworzenie ✅ (`createKaraokePlaylist`, inline create w sidebar), zapisywanie ✅ (server-side persistence); udostępnianie: **publish/unpublish API** + rename + duplicate + share-link (clipboard) dodane w `SongBrowserSidebar.tsx`; **reorder**: ▲/▼ przyciski w `SongRow`, `customSongOrder` state w `KaraokeSongBrowser`, `reorderPlaylistSongs` API + `useReorderPlaylistSongsMutation` hook ✅

### Multiplayer Song Selection
- [x] Użycie padów do jednoczesnego wyboru piosenek do sesji karaoke przez kilku graczy — `SongSelectionModeManager.tsx` z 4 trybami: freeForAll, roundRobin, hostOnly, **firstCome** (countdown 3..2..1 + wyścig); zintegrowane w `KaraokeSongBrowserPage.tsx` (widoczne gdy >1 gracz); `SongSelectionMode` typu union z `'firstCome'` ✅
- [x] Tryby: gracze po kolei, na raz, kto pierwszy ten lepszy (odliczanie) — roundRobin (timer, auto-advance), freeForAll (wszyscy), firstCome (countdown + race), hostOnly (tylko host) ✅

### Tuning Harness & Debug
- [x] Replay nagrań z pitch points i notami, batch sweepy parametrów — `TuningHarnessPage.tsx` z JSON import, interaktywnymi sliderami (semitoneTolerance, preWindow, postExtra, difficultyMult, completionBonus, goldFullBonus), instant re-score, preset sweep table (easy/normal/hard), route `/tuning-harness` ✅
- [x] Eksport CSV/JSON z wynikami i metadanymi — export JSON (full result + params), export CSV (per-note detail), export sweep CSV (all presets comparison), `exportFixtureBundle()` w `useKaraokeManager` (download notes+points z live sesji) ✅
- [x] Segmentation heatmap view, eksport screenshotów — canvas-based heatmap (pitch×time, color-coded frac: red→green, gold note glow, pitch point dots), legend, per-note detail table z progress bars ✅
- [x] Telemetry tuning runs — localStorage history z tabelą porównawczą, save/delete/clear, best-run highlight
- [x] Unit tests: `scoreNotesWithPitchPoints`, integracyjne testy replay — `karaokeScoring.comprehensive.spec.ts`: 48 testów (`getVerseRatingLabel` 14, `getComboMultiplier` 12, `scoreNotesWithPitchPoints` 12, `buildNoteDescriptors` 3, `buildSegmentScores` 2, `downsampleAndQuantizePitchPoints` 4), all PASS ✅

---

## 🎹 AUDIO EDITOR

- [x] Rozbić AudioEditor.tsx (2248 linii) na mniejsze komponenty/skrypty ✅ (patrz Dekompozycja powyżej)
- [x] Tryby wyświetlania: Fun — Beginner — Mid — Expert — Master — `DisplayModeSelector` + `editorDisplayModes.ts` (17 flag widoczności) + wiring w `AudioEditor.tsx` ✅
- [x] Tutorial do AudioEditora — `tutorialDefinitions.ts` (8-step guided tour: welcome, display mode, transport, layers, zoom, recording, save, shortcuts), auto-launch on first visit, `?` button fixed bottom-right, `TutorialOverlay.tsx` (spotlight + keyboard nav) ✅
- [x] Karaoke editor — przeglądanie/tworzenie/edycja plików UltraStar z yt — **kompletna implementacja**: `EditorShell.tsx` (4 zakładki: Audio, Notes, Text, Export), `NotesTab.tsx` (723 linii, canvas piano roll z drag/resize/snap/undo/redo), `TextTab.tsx` (576 linii, Monaco Editor z walidacją UltraStar), `AudioTab.tsx` (pitch analysis → auto-generate notes), `ExportTab.tsx` (download .txt, Phaser preview), YouTube search & embed, backup/restore JSON, collaborators & version history, routes `/karaoke-editor` i `/karaoke-editor/:songIdParam` ✅
- [x] **Ekstrakcja metadanych + Spotify lookup** — `SongMetadataLookup.tsx` (~230 linii): parsowanie ID3/Vorbis tagów z `music-metadata-browser` (title, artist, album, genre, year, BPM, cover art), fallback na parsowanie nazwy pliku ("Artist - Title"), auto-wyszukiwanie Spotify via `fetchSpotifySearch`, wybór tracka z wynikami (cover art + podgląd), "Apply to Song" wstrzykuje metadane do nagłówków UltraStar (#TITLE, #ARTIST, #ALBUM, #GENRE, #YEAR, #BPM, #COVER). Zintegrowane w `AudioTab.tsx` + `EditorShell.tsx` (`handleMetadataApply`) ✅
- [x] Audio stem separation (Demucs) — `StemSeparator.tsx` (NEW, ~260 lines): AI-powered audio separation into individual stems (vocals, drums, bass, other, piano) via backend `/api/ai/audio/separate`, ZIP decompression (fflate), per-stem audio preview with play/pause, stem count selector (2/4/5), radio stem picker, auto-analyze on selection. Integrated into `AudioTab.tsx` — button "Separate Tracks (Demucs)" appears after file upload, selected stem replaces analysis target. ✅
- [x] Seed podkładów demo — `MidiSeedDemo.tsx` (multi-layer: melody, bass, chords, drums), `midiSeedGenerator.ts` z configurable scale/progression/patterns, mini piano-roll preview, import do edytora via `handleSeedImport` ✅
- [x] MIDI Automation UI panels — 4 new visual components wired into AudioEditor sidebar (Expert/Master modes): `CCAutomationLaneEditor.tsx` (canvas CC lane viz, 5 draw modes, LFO apply, undo/redo, export/import, clear), `StepSequencerPanel.tsx` (step grid, velocity bars, pattern ops, transport), `ArpeggiatorPanel.tsx` (7 modes, octave/rate/gate/swing/latch), `LFOPanel.tsx` (6 waveforms, canvas preview, BPM sync). `showMidiAutomation` display mode flag added to `editorDisplayModes.ts` ✅

---

## 🎮 MINIGIERKI & JAM SESSION

- [x] KaraokeSession z padem zamiast mikrofonu — pełna implementacja: `PadNotePlayer` (380 linii, 3 trudności: easy/normal/hard, keyboard + gamepad), `PadKaraokeOverlay.tsx` (269 linii, canvas z lane'ami i feedbackiem), `padKaraokeSession.ts` (scoring + grading), zintegrowane w `useKaraokeManager` (`isPadMode`, `padLanes`, `padEvents`) i `KaraokeManager.tsx` ✅
- [x] Więcej mini-gierek muzycznych — **kompletne**: 26 couch mini-games w `pages/games/mini/`, 5 typów muzycznych w `miniGamesEngine.ts`, HitThatNote (Phaser); **song-specific generation**: `generateMiniGameFromSong()` + `getSuitableGameTypes()` z prawdziwych danych UltraStar (rhythmFromSong, melodyFromSong, chordFromSong, intervalFromSong, sequenceFromSong), `SongMiniGamesPage.tsx` z 4-fazowym UI (pickSong → pickGame → playing → result), route `/mini-games/song`, karta 🧩 na PlayPage ✅
- [x] Refaktor multiplayer — lokalnego i offline. ✅ Zaimplementowano: `BaseStreamClient.ts` (280 linii) — abstrakcyjna klasa bazowa wyciągnięta z `crepeStreaming.ts` i `librosaStreaming.ts` (eliminacja ~400 linii duplikacji: WS lifecycle, reconnect, send queue, mic capture, resample, PCM encode, AudioWorklet/ScriptProcessor fallback); `MultiplayerTransport.ts` — interfejs `IMultiplayerTransport` + `LocalTransport` (in-memory event bus dla couch co-op) + `OfflineTransport` (kolejka offline z localStorage, auto-flush po reconnect); `useOfflineQueue.ts` hook (buforowanie eventów offline, auto-flush on `navigator.onLine`, manual flush/clear)
- [x] Jam session mode z padem/klawiatur\u0105 jako instrumentem — `/jam-session` route, `JamSession.tsx` (188 linii, 16-pad grid, keyboard mapping), `jamSession.ts` engine (drum kit + synth presets, Web Audio), `useJamSession.ts` hook, 81+ WAV samples w `public/audioClips/`, karta na PlayPage + wpis w navbar `gamesItems` ✅

---

## 🧍 ANIMATED PERSON

- [x] Weryfikacja i poprawa AnimatedPerson — kompletna implementacja: `AnimatedPerson.tsx` (407 linii SVG z wariantami), `characterTypes.ts`, `animationHelper.ts`, `choreoDSL.ts`/`choreography.ts`/`AudiencePrograms.ts`, `rig/` (8 plików IK), `shapes/` (10 plików), `AnimatedPersonEditor.tsx`, `Jurors.tsx`, `Audience.tsx`, testy + Storybook, route `/characters` ✅

---

## 🎧 PLAYLIST MANAGER & INTEGRACJE

- [x] Łączenie z serwisami audio: Spotify, Tidal, YouTube — import/export playlist (ServiceConnectorPanel, PlaylistManagerPage), metadane, OAuth, play/eksport do serwisu. Streaming audio: TODO (API limitation). Wszystkie UI podpięte, toast/error/loading UX poprawione.
- [x] PlaylistManager (PlaylistsPage) — zaawansowany import/export/manage, budowanie zwykłych i dynamicznych playlist z wieloma źródłami, tagi, katalogi, widok 1 panelu lub Norton Commander. ✅ Zaimplementowano: 4 tryby widoku (List/Grid/Compact/DualPane), sidebar z folderami/playlistami, toolbar z wyszukiwaniem/tagami/serwisami, multi-format import/export (JSON/M3U/CSV) via `playlistFormatUtils.ts`, `DynamicRuleEditor.tsx` (wizualny edytor reguł dynamicznych z zagnieżdżonymi grupami AND/OR, 11 pól, 10 operatorów, max limit), handlePlay wiring (YouTube/Spotify/Tidal/URL), 5 sub-komponentów (PlaylistSidebar, PlaylistTrackList, PlaylistDualPane, PlaylistSearchBar, PlaylistTagEditor, ServiceConnectorPanel)
- [x] BoardGameCollection — budowanie kolekcji z zewnętrznym API — `BoardGameCollectionPage.tsx` (575 linii): BGG API integration (`BggSearchPanel`, `fetchBggSearch`/`fetchBggDetail`), grid/list view, sort, filter, import/export JSON, full CRUD ✅

---

## ❓ UX / POMOC

- [x] Na każdej stronie `?` — pomoc, podpowiedzi, instrukcje, tutoriale (z możliwością wyłączenia, domyślnie włączone) — `HelpButton.tsx` + `HelpPanel.tsx` (Offcanvas) + `helpContent.ts` (20+ artykułów wiki, route matching, powiązane tematy) ✅
- [x] Dropdown Pomoc z sekcją wiki — kompletne wiki do całości — `HelpPanel` z Offcanvas, lista tematów, kontekstowe artykuły per-strona ✅
- [x] **Wiki dokumentacja** — 30 kompletnych stron markdown w `docs/wiki/`: architektura frontendu, system karaoke, edytor karaoke, przetwarzanie audio, klient API, komponenty UI, zarządzanie stanem, testy, i18n, uwierzytelnianie, gry i interakcje, Honest Living RPG, Audio Editor DAW, MIDI i automatyka, system imprez, mini-gry, Animated Person, playlist manager, odtwarzacz + wizualizery, theming, bezpieczeństwo i audyt, DMX lighting, nawigacja gamepadem, pomoc i tutoriale, multiplayer real-time, tuning harness, timeline rendering, taniec i detekcja pozy, eksplorator biblioteki, modele danych + `wiki-seed-manifest.json` (manifest do bulk importu w formacie WikiPage) ✅
- [x] UX zoptymalizowany do perfekcji — loading skeletony, toasty, error states, transitions, responsywność. Wszystkie panele playlist/serwisów z micro-interakcjami i feedbackiem.

---

## 🔧 PERFORMANCE

- [x] **Phaser i Monaco Editor** — już za `React.lazy` route boundaries (HitThatNote, HonestLiving, KaraokeEditor); Monaco ma `React.lazy(() => import(...))` + type-only import; Phaser w osobnym `vendor_phaser` chunk (1.5 MB) ładowanym tylko przy nawigacji do trasy ✅
- [x] **`useMemo`/`useCallback`/`React.memo`** — zoptymalizowano KaraokeSongBrowser: wyodrębniono `SongRow` z `React.memo`, dodano `useCallback` do `handleSort`/`getSongCover`/resolve/playlist callbacks, dodano debouncing wyszukiwania (300ms) ✅
- [x] **`apiPlaylists.ts` typowanie** — dodano `PlaylistDto`, `PlaylistItemDto`, `PlaylistLinkDto`, `PlaylistAccess`, `RequestMechanism` do `modelsPlaylists.ts`; zamieniono `Record<string, unknown>` → `PlaylistDto`; usunięto `any` z PlaylistsPage i PlaylistDetailsPage ✅

---

## 🚀 PRZYSZŁOŚĆ

### Party
- [x] Party page z kodem i linkiem do dołączenia z telefonu (QR) — `PartyQRCode.tsx` (inline + fullscreen modal), QR w `JoinPartyPage.tsx`, `qrcode.react` ✅

### MIDI / Audio Automation
- [x] Nagrywanie automatyki CC podczas gry na klawiaturze MIDI — `useCCAutomation.ts` hook (275 linii) + `ccAutomation.ts` engine (203 linii) z real-time recording via `recordCCEvent()` ✅
- [x] Wsparcie krzywych Bezier/niestandardowych — `bezierCurve.ts` (186 linii): `cubicBezier`, `sampleBezierCurve`, `bezierToSVGPath`, `buildBezierSegments`, `interpolateBezierCC` ✅
- [x] Wizualizacja wartości CC na wykresie — `CCAutomationLaneEditor.tsx`: canvas-based CC lane editor z time×value axes, event dots, filled area chart, grid, hover, 5 draw modes ✅
- [x] Kopiowanie/wklejanie fragmentów automatyki — `copyCCEvents`/`pasteCCEvents`/`cutCCEvents` in `ccAutomation.ts`, wired via `useCCAutomation` hook ✅
- [x] Undo/Redo dla edycji automatyki — `CCHistoryState` z pushCCState/undoCC/redoCC, buttons in `CCAutomationLaneEditor` toolbar ✅
- [x] Eksport/import lane automatyki — `exportCCLane`/`importCCLane` JSON + download/upload UI in `CCAutomationLaneEditor` ✅
- [x] Reset lane do domyślnych wartości — Clear button in `CCAutomationLaneEditor` removes all events for active CC lane ✅
- [x] MIDI Learn (przypisywanie CC do parametrów instrumentu) — `useMidiLearn.ts` (381 linii): CC/Note/PitchBend/Aftertouch bindings, localStorage persistence, learn mode ✅
- [x] Automatyka Pitch Bend, Aftertouch, multi-lane, podgląd CC podczas odtwarzania — `audioPlaybackEngine.ts` schedules CC events during playback (20Hz interpolation), `MidiCCEvent.handleType` supports linear/step/exp curves ✅
- [x] Integracja z zewnętrznymi kontrolerami MIDI — `useWebMidi.ts` (102 linii): Web MIDI API access, `useMidiLearn.ts` binds external MIDI controller CC/notes to parameters ✅
- [x] Automatyka per-klip, globalna, step sequencer, draw tool, envelope follower, LFO, random, pattern — `stepSequencer.ts` (228 linii) + `StepSequencerPanel.tsx` UI, `drawTool.ts` (198 linii, 5 modes: pencil/line/curve/step/ramp) + wired in `CCAutomationLaneEditor`, `envelopeFollower.ts` (144 linii), `lfoEngine.ts` (199 linii) + `LFOPanel.tsx` UI, `macroSystem.ts` (341 linii) ✅
- [x] Arpeggiator, chord, scale, groove, humanize, swing, legato, staccato, accent, glide, portamento — `arpeggiator.ts` (189 linii, 7 modes) + `ArpeggiatorPanel.tsx` UI, `chordScale.ts` (237 linii), `articulationEngine.ts` (309 linii: legato/staccato/accent/glide/portamento/tremolo) ✅
- [x] Sequence, pattern chain, song mode, performance, live, session, arrangement — `stepSequencer.ts` pattern model with shift/reverse/transpose/randomize, `useStepSequencer.ts` hook with playback scheduling & LFO integration ✅
- [x] Clip/scene launch, follow actions, macro, mapping, modulation, expression, articulation — `macroSystem.ts` (modulationMatrix, LFO modulator, macro knobs), `articulationEngine.ts` (CC generation per articulation type) ✅
- [ ] MPE, per-note, per-channel, per-track, per-project support — future expansion (requires full MIDI 2.0 spec)

---

## 📋 BACKEND — specyfikacja do implementacji

### Scoring Presets (admin)
- `GET /api/admin/scoring-presets` — zwraca presety easy/normal/hard
- `POST /api/admin/scoring-presets` — nadpisuje presety
- `PUT /api/admin/scoring-presets` — partial merge (opcjonalnie)
- DB: `admin_scoring_presets(config jsonb, modified_by, modified_at)` lub `system_settings(key, value JSON)`
- Walidacja: `semitoneTolerance` 0..12, `preWindow`/`postExtra` 0..5s, `difficultyMult` 0.5..2
- Audit log zmian presetów (kto, kiedy, diff), rollback/wersjonowanie

### Microphone offsetMs (user API)
- `GET /api/user/microphones` — dodać pole `offsetMs`
- `PUT /api/user/microphones/{id}` — akceptować `offsetMs` (integer ms, zakres -2000..2000)
- Migration: `ALTER TABLE user_microphones ADD COLUMN offset_ms integer NULL`

### Opcjonalnie
- `GET /api/config/karaoke-scoring` — publiczny endpoint presetów (runtime servers)


---

KaraokeManager — priorytet: UltraStar World Party parity (lista zadań)

- Timeline i rendering ✅ DONE
	- ✅ Canvas-based timeline per player — `karaokeTimeline.ts` (1037 linii)
	- ✅ Mapowanie czasu → piksele, przewijanie z exponential smoothing
	- ✅ Paski nut z gold (#B8860B fill + #FFD700 stroke), hit flash overlay
	- ✅ Paint trail z globalAlpha fading, kulka w `playerBgColor`

- Scoring (UltraStar rules) ✅ DONE
	- ✅ Gold notes, segmentation scoring, difficulty presets — `karaokeScoring.ts`
	- ✅ Combo multiplier, verse ratings (Awful→Perfect)

- Visuals i animacje ✅ DONE
	- ✅ Kulka, hit animations (accuracy-colored), gold particle bursts
	- ✅ User pitch overlay re-enabled (was `if (false)`)

- Latency i kalibracja — ✅ DONE
	- ✅ Udoskonalić LatencyCalibrator: ScriptProcessorNode, 3-round, outlier trimming
	- ✅ Zapisywanie offsetMs: GameContext + useKaraokeManager pipeline
	- ✅ Offset slider w TuningHarness (-500..+500 ms)
	- ✅ Auto-seed w harness — sweep offset w TuningHarnessPage

- Detekcja pitchu — ✅ DONE
	- ✅ CREPE via AudioWorklet z retry/backoff + pitchy fallback
	- ✅ UI do wyboru algorytmu per-mikrofon z persistencją (PlayerForm + GameContext)

- Narzędzia tuningowe / parity harness — ✅ DONE
	- ✅ `TuningHarnessPage.tsx` — JSON fixture import, interactive sliders, instant re-score, preset sweep, heatmap, CSV/JSON export
	- ✅ `exportFixtureBundle()` w `useKaraokeManager` — download notes + pitch points z live sesji karaoke
	- ✅ Demo fixture generator (10 nut, auto pitch points)

- Debug / telemetry — ✅ DONE
	- ✅ Segmentation heatmap view + per-note detail table + verse ratings + combo stats
	- ✅ Zbieranie telemetry (tuning runs) — localStorage + tabela porównawcza w TuningHarnessPage

- Testy i QA — ✅ DONE
	- ✅ 48 unit tests w `karaokeScoring.comprehensive.spec.ts` (getVerseRatingLabel, getComboMultiplier, scoreNotesWithPitchPoints, buildNoteDescriptors, buildSegmentScores, downsampleAndQuantizePitchPoints)
	- ✅ Istniejące 24 testy — regression PASS
	- ✅ Fixture bundles — `simple-scale.fixture.json` (8 nut, pełne pokrycie) + `partial-hits.fixture.json` (6 nut, 2 bez pitch) + `karaokeScoring.regression.test.ts` (11 testów: determinizm, combo, verse ratings, offset degradation, difficulty presets)

Priorytet: latency persistence → CREPE → tuning harness → debug/telemetry → testy.


