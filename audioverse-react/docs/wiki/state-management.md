# Zarządzanie stanem — Frontend

## Strategia
AudioVerse nie używa Redux ani MobX. Stan zarządzany jest przez:
1. **React Context API** — stan globalny (gra, audio, użytkownik, motyw)
2. **React-Query** — stan serwerowy (cache, rewalidacja, synchronizacja)
3. **useState/useRef** — stan lokalny komponentów
4. **localStorage** — persystencja ustawień offline

## React Contexts

### GameContext (`contexts/GameContext.tsx`)
**Cel:** Stan sesji karaoke — gracze, mikrofony, algorytmy, tryb gry.

**Stan:**
```typescript
interface GameContextType {
    state: GameState;           // { players: Player[], mics: MediaDeviceInfo[] }
    playersLoading: boolean;
    gameMode: GameMode;         // normal | demo | blind | ...
    difficulty: Difficulty;     // easy | normal | hard
    defaultPitchAlgorithm: PitchAlgorithm;  // autocorr | pitchy | crepe | librosa
    micAlgorithms: { [playerId: number]: PitchAlgorithm };
    micRmsThresholds: { [deviceId: string]: number };
    micOffsets: { [deviceId: string]: number };
    micGains: { [deviceId: string]: number };
    micPitchThresholds: { [deviceId: string]: number };
    micSmoothingWindows: { [deviceId: string]: number };
    micHysteresisFrames: { [deviceId: string]: number };
    micUseHanning: { [deviceId: string]: boolean };
    micMonitorEnabled: { [deviceId: string]: boolean };
    micMonitorVolumes: { [deviceId: string]: number };
    // ... akcje
}
```

**Ładowanie danych:**
1. Backend: `GET /api/user/microphones` → MicrophoneDto[]
2. Budowanie map per-device (rmsThresholds, offsets, gains, ...)
3. Fallback: localStorage (`mic_settings_{deviceId}`)
4. Per-player: `GET /api/user/players` → Player[]
5. Fallback: domyślny "Gracz 1"

**Persystencja:**
- `localStorage: "audioverse.difficulty"` — poziom trudności
- `localStorage: "audioverse.pitchAlgorithm"` — domyślny algorytm
- `localStorage: "mic_settings_{deviceId}"` — ustawienia per mikrofon

### AudioContext (`contexts/AudioContext.tsx`)
**Cel:** Lista urządzeń audio (mikrofony i wyjścia).

**Stan:**
- `audioInputs: MediaDeviceInfo[]` — lista mikrofonów
- `audioOutputs: MediaDeviceInfo[]` — lista wyjść audio
- Automatyczne odświeżanie przy `devicechange` event

### UserContext (`contexts/UserContext.tsx`)
**Cel:** Autentykacja i dane użytkownika.

**Stan:**
- `currentUser: CurrentUserResponse | null`
- `userId: number | null`
- `isAuthenticated: boolean`
- `login(credentials)` / `logout()`
- `refreshToken()`

### ThemeContext (`contexts/ThemeContext.tsx`)
**Cel:** Motyw UI i preferencje wyświetlania.

**Stan:**
- `theme: 'dark' | 'light'`
- `toggleTheme()`
- CSS custom properties automatycznie aktualizowane

### GamepadNavigationContext
**Cel:** Obsługa gamepadów (padów) do nawigacji w UI.

**Stan:**
- `activeElement` — aktualnie sfokusowany element
- `setActive(id)` — ustawienie fokusu
- `pushFocusTrap(id)` / `popFocusTrap()` — pułapki fokusu (modale)

## React-Query — Stan serwerowy

### Konwencja kluczy zapytań
```typescript
// Karaoke
['karaoke', 'songs']
['karaoke', 'song', songId]
['karaoke', 'top', songId]

// External
['external', 'spotify', 'search', query]
['external', 'spotify', 'track', trackId]

// Wiki
['wiki', 'pages']
['wiki', 'page', slug]
['wiki', 'nav']
```

### Mutacje
```typescript
const mutation = useMutation({
    mutationFn: (data) => updateMicrophone(id, data),
    onSuccess: () => queryClient.invalidateQueries(['microphones']),
});
```

## localStorage — Persystencja offline

| Klucz | Zawartość | Opis |
|-------|----------|------|
| `audioverse.difficulty` | string | Poziom trudności |
| `audioverse.pitchAlgorithm` | string | Domyślny algorytm |
| `audioverse.difficulty.profile.{id}` | string | Trudność per profil |
| `mic_settings_{deviceId}` | JSON | Ustawienia mikrofonu |
| `audioTab_selected_mic` | string | Wybrany mikrofon w edytorze |
| `audioverse-audio-backup` | JSON | Backup pracy edytora |
| `karaokeDisplaySettings` | JSON | Ustawienia wyświetlania karaoke |
| `karaokeSettings` | JSON | Ustawienia scoringu/renderingu |
| `karaokeSettings.player.{id}` | JSON | Ustawienia per gracz |
