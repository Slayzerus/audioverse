# Komponenty UI — Frontend

## Layout

### AppShell (`components/layout/AppShell.tsx`)
Główny kontener aplikacji:
- Navbar (górna nawigacja)
- Sidebar (boczna nawigacja)
- Obszar treści
- Footer

### Navbar
Górna nawigacja z:
- Logo i nazwa aplikacji
- Przełącznik motywu (dark/light)
- Selector języka (PL/EN)
- Menu użytkownika (profil, ustawienia, wyloguj)

## Kontrolki audio

### AudioPitchLevel (`components/controls/input/source/AudioPitchLevel.tsx`)
Zaawansowany panel ustawień mikrofonu:
- **Podgląd na żywo**: wykres pitchu, FFT, timeline
- **Regulacja parametrów**: gain, RMS threshold, pitchThreshold, smoothing, hysteresis, Hanning
- **Monitoring**: odsłuch przez głośniki z regulacją głośności
- **Kalibracja latencji**: automatyczna detekcja opóźnienia
- **Import/Export**: ustawień z/do pliku JSON
- **Zapis**: do backendu i localStorage

### GenericPlayer (`components/controls/player/GenericPlayer.tsx`)
Uniwersalny odtwarzacz audio/wideo:
- Wsparcie dla: HTML5 Audio, HTML5 Video, YouTube (iframe)
- Interfejs: play, pause, seek, volume
- Integracja z karaoke (synchronizacja czasu)

## Animacje

### Efekty karaoke (`components/animations/`)
- **Confetti** — efekty po zakończeniu piosenki
- **Verse ratings** — wizualne oceny per zwrotka (Poor → Perfect)
- **Score indicators** — latające punkty
- **Combo fire** — efekt przy wysokim kombo
- **Juror reactions** — reakcje AI jurorów

### karaokeIntegration
Magistrala zdarzeń (`scoreBus`) łącząca scoring z animacjami:
```typescript
scoreBus.push(score);  // emituje zdarzenie scoringu
```

## Formularze

### PlayerFormModal
Modal dodawania/edycji gracza:
- Imię gracza
- Wybór mikrofonu (z listy `navigator.mediaDevices`)
- Kolor gracza (z palety PLAYER_COLORS)

### SettingsPage
Strona ustawień użytkownika:
- Ustawienia wyświetlania (motyw, animacje, czcionka)
- Ustawienia audio (mikrofon, algorytm detekcji)
- Ustawienia gry (trudność, tryby)

## Toast / Powiadomienia

### ToastProvider (`components/ui/ToastProvider.tsx`)
Globalny system powiadomień:
```typescript
const { showToast } = useToast();
showToast('Zapisano ustawienia', 'success');
showToast('Błąd połączenia', 'error');
```

## MIDI

### CCAutomationLaneEditor
Edytor automatyzacji MIDI CC (Control Change).

### StepSequencerPanel
Sekwencer krokowy dla syntezatorów.

### ArpeggiatorPanel
Panel arpeggiatora z ustawieniami wzorców.

### LFOPanel
Panel Low-Frequency Oscillator do modulacji parametrów.

## Wiki

### WikiBrowser (`components/wiki/WikiBrowser.tsx`)
Przeglądarka stron wiki:
- Drzewo nawigacji (kategorie + podstrony)
- Renderowanie Markdown
- Wyszukiwanie pełnotekstowe
- Breadcrumbs (nawigacja okruszkowa)
- Historia rewizji
