# Mini-gry i Jam Session

26 kanapowych mini-gier zbudowanych na HTML5 Canvas, system rejestracji gier, lobby graczy z obsługą gamepadów, generowanie mini-gier z danych UltraStar, silnik mini-gier muzycznych oraz tryb Jam Session.

## Architektura

```
pages/games/mini/  (26 gier)
 ├─ gameRegistry.ts         — katalog i metadane gier
 ├─ PlayerLobby.tsx         — lobby z Join gamepadem
 ├─ inputMaps.ts            — mapowanie wejść
 ├─ useGamepads.ts          — hook gamepadów
 ├─ PongGame.tsx / PongPage.tsx
 ├─ TronGame.tsx / TronPage.tsx
 ├─ SnakesGame.tsx / SnakesPage.tsx
 ├─ BreakoutGame.tsx / BreakoutPage.tsx
 ├─ AsteroidsGame.tsx / AsteroidsPage.tsx
 ├─ MazeGame.tsx / MazePage.tsx
 ├─ TanksGame.tsx / TanksPage.tsx
 ├─ RaceGame.tsx / RacePage.tsx
 ├─ ArcheryGame.tsx / ArcheryPage.tsx
 ├─ HockeyGame.tsx / HockeyPage.tsx
 └─ ... (16 kolejnych gier)

pages/games/
 ├─ MiniGamesRouter.tsx     — routing mini-gier
 └─ SongMiniGamesPage.tsx   — mini-gry oparte na piosenkach

utils/
 └─ miniGamesEngine.ts      — generowanie gier z UltraStar

scripts/games/
 └─ hitThatNote.ts           — mini-gra Phaser (pitch detection)

components/games/
 ├─ HitThatNote.tsx          — komponent React dla HitThatNote
 └─ JamSession.tsx           — interfejs Jam Session
```

## Rejestracja gier

`gameRegistry.ts` definiuje katalog wszystkich 26 gier z metadanymi:
- **Nazwa i opis** — wyświetlane w lobby
- **Min/max graczy** — ograniczenia multiplayer
- **Kategoria** — arcade, puzzle, sport, muzyka
- **Komponent** — lazy-loaded React component

## Lobby graczy

`PlayerLobby.tsx`:
- Widok oczekiwania na graczy
- Dołączanie gamepadem (naciśnij Start)
- Dołączanie klawiaturą (konfigurowalne klawisze)
- Wyświetlanie kolorów i nazw graczy
- Countdown do startu

## Lista mini-gier (26)

### Arcade
- **Pong** — klasyczny Pong 2-osobowy
- **Tron** — ścieżki świetlne
- **Snakes** — wąż multiplayer
- **Breakout** — odbijanie piłeczki
- **Asteroids** — strzelanie do asteroid

### Sport
- **Hockey** — hokej stołowy
- **Archery** — łucznictwo
- **Race** — wyścig

### Strategia
- **Tanks** — turowe czołgi
- **Maze** — labirynt

### Muzyczne
- **HitThatNote** — gra Phaser z detekcją pitch (mikrofon)

## Generowanie mini-gier z piosenek

`miniGamesEngine.ts` — 5 typów gier muzycznych generowanych z danych UltraStar:

| Typ | Funkcja | Opis |
|---|---|---|
| Rhythm | `rhythmFromSong()` | Gra rytmiczna z timingiem nut |
| Melody | `melodyFromSong()` | Odtwarzanie melodii (pitch) |
| Chord | `chordFromSong()` | Rozpoznawanie akordów |
| Interval | `intervalFromSong()` | Identyfikacja interwałów |
| Sequence | `sequenceFromSong()` | Zapamiętywanie sekwencji |

### Przepływ Song Mini-Games

`SongMiniGamesPage.tsx` — 4-fazowy UI:
1. **pickSong** — wybór piosenki z biblioteki UltraStar
2. **pickGame** — wybór typu gry (filtrowane przez `getSuitableGameTypes()`)
3. **playing** — rozgrywka
4. **result** — wynik i możliwość replay

## HitThatNote (Phaser)

`hitThatNote.ts` — mini-gra oparta na Phaser:
- Nuty lecą w dół ekranu
- Gracz śpiewa do mikrofonu
- Pitch detection porównuje z oczekiwanym tonem
- Scoring: perfect/good/miss
- Phaser chunk ładowany dynamicznie (~1.5 MB)

## Jam Session

Tryb wirtualnego instrumentu z 16-padową siatką:

```
components/games/JamSession.tsx    — 188 linii, UI siatki 4×4
utils/jamSession.ts                — silnik (drum kit + synth, Web Audio)
hooks/useJamSession.ts             — hook zarządzania sesją
services/simpleSynth.ts            — prosty syntezator
public/audioClips/                 — 81+ próbek WAV
```

### Funkcje Jam Session
- **16 padów** — konfigurowalna siatka 4×4
- **Mapowanie klawiatury** — klawisze przypisane do padów
- **Presety** — drum kit, syntezator
- **Web Audio** — odtwarzanie próbek przez AudioContext
- Karta na PlayPage + wpis w navbar `gamesItems`

### Presety instrumentów
- **Drum Kit** — kick, snare, hi-hat, cymbals, toms, claps, rimshot
- **Synth** — podstawowe kształty fali (sine, square, saw, triangle)

## Input i gamepady

`inputMaps.ts` — mapowanie wejść:
- D-pad i analogi → ruch
- Przyciski A/B/X/Y → akcje
- Start/Select → menu/join/leave

`useGamepads.ts` — hook do obsługi gamepadów:
- Polling `navigator.getGamepads()`
- Debouncing wejść
- Konfiguracja dead zone

## Routing

| Ścieżka | Komponent |
|---|---|
| `/mini-games` | `MiniGamesRouter.tsx` |
| `/mini-games/song` | `SongMiniGamesPage.tsx` |
| `/mini-games/:gameId` | Dynamiczny per-game |
| `/jam-session` | `JamSessionPage.tsx` |
