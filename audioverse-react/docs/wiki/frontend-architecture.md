# Frontend — Architektura i przegląd

## Technologie
| Warstwa | Technologia |
|---------|------------|
| Framework | React 18 + TypeScript (Vite) |
| Routing | React Router v6 |
| Stan globalny | React Context API (GameContext, AudioContext, UserContext, ThemeContext) |
| Zapytania API | TanStack React-Query + Axios |
| Stylowanie | Bootstrap 5 + CSS Modules + inline styles |
| i18n | react-i18next (pl, en) |
| Build | Vite, tsconfig strict (`noUnusedLocals`, `noUnusedParameters`) |
| Testy | Vitest + React Testing Library (1578+ testów) |
| E2E | Playwright + Cypress |

## Struktura katalogów

```
src/
├── components/        # Komponenty UI
│   ├── animations/    # Efekty wizualne, confetti, reakcje jurorów
│   ├── controls/      # Kontrolki: karaoke, player, input, MIDI
│   ├── editor/        # Edytor karaoke (UltraStar)
│   ├── games/         # Gra muzyczna, quiz
│   ├── layout/        # AppShell, Navbar, Sidebar, Footer
│   ├── ui/            # Toast, Modal, tabs, loading
│   └── wiki/          # Przeglądarka wiki
├── contexts/          # React Contexts (GameContext, AudioContext, UserContext...)
├── constants/         # Stałe (kolory graczy, scoring presets, animacje)
├── hooks/             # Custom hooks (useLocalStorage, useWindowSize, useDebounce)
├── models/            # Typy TypeScript, DTOs, interfejsy
├── pages/             # Strony routowane (KaraokePage, EditorPage, AdminPage...)
├── scripts/           # Logika biznesowa, API klienty, parsery
│   ├── api/           # Klienty API (apiUser, apiKaraoke, apiLibrary, apiLibraryAiAudio...)
│   └── karaoke/       # Parser UltraStar, timeline, scoring
├── services/          # Serwisy (PlayerService, ProfilePlayerService, rtcService)
├── styles/            # Pliki CSS/SCSS
└── utils/             # Narzędzia (karaokeScoring, karaokeHelpers, streaming)
```

## Konteksty (Context API)

### GameContext
Zarządza stanem gry: gracze, mikrofony, tryb gry, trudność, algorytm detekcji pitchu.

**Kluczowe mapy per-device:**
- `micAlgorithms` — algorytm detekcji pitchu per gracz
- `micRmsThresholds` — próg RMS ciszy per mikrofon
- `micOffsets` — korekta latencji (ms) per mikrofon
- `micGains` — wzmocnienie mikrofonu (0–3)
- `micPitchThresholds` — próg jasności pitchu (0–1)
- `micSmoothingWindows` — okno wygładzania (ramki)
- `micHysteresisFrames` — histereza (ramki ciszy przed zerowaniem)
- `micUseHanning` — flaga okna Hanninga
- `micMonitorEnabled` — odsłuch mikrofonu
- `micMonitorVolumes` — głośność odsłuchu (0–100)

### AudioContext
Zarządza urządzeniami audio: lista mikrofonów, lista wyjść, wybrany mikrofon.

### UserContext
Autentykacja: currentUser, userId, login/logout, tokeny JWT.

### ThemeContext
Motyw UI: dark/light, kolory, ustawienia wyświetlania.

## Routing

```
/                  → Strona główna / Dashboard
/karaoke           → Widok karaoke (KaraokeManager)
/editor            → Edytor karaoke (EditorShell)
/editor/:songId    → Edytor z załadowaną piosenką
/songs             → Biblioteka piosenek
/settings          → Ustawienia użytkownika
/admin             → Panel administracyjny
/wiki              → Przeglądarka wiki
```

## Przepływ danych

1. **Użytkownik → UI** — akcje użytkownika (kliknięcia, upload, śpiewanie)
2. **Contexts** — stan globalny propagowany przez React Context
3. **React-Query** — cache'owane zapytania API z automatyczną rewalidacją
4. **API Backend** — REST endpoints (.NET) + WebSocket (SignalR, pitch streaming)
5. **Web Audio API** — przetwarzanie audio w przeglądarce (detekcja pitchu, gain, FFT)
