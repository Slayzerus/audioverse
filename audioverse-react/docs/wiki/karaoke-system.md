# System Karaoke — Frontend

## Przegląd
System karaoke AudioVerse to kompletna platforma śpiewania z detekcją pitchu w czasie rzeczywistym,
scoringiem, wieloma graczami, trybami gry i integracją z AI.

## Główne komponenty

### KaraokeManager (`components/controls/karaoke/KaraokeManager.tsx`)
Główny widok karaoke — orkiestruje całą sesję śpiewania:
- Ładowanie piosenek (upload plików UltraStar lub z biblioteki)
- Odtwarzanie audio/wideo (GenericPlayer)
- Detekcja pitchu w czasie rzeczywistym
- Scoring i ocenianie
- Wieloosobowa gra (multi-mic)
- Tryby gry: normal, demo, no-timeline, blind, instrumental, pad

### useKaraokeManager (hook)
Centralny hook zarządzający logiką karaoke:

```typescript
const km = useKaraokeManager({
    showJurors, initialSong, gameMode,
    initialRoundId, initialRoundPartId
});
```

**Zwraca:**
- `uploadedSong` — załadowana piosenka (KaraokeSongFile)
- `isPlaying` / `currentTime` — stan odtwarzania
- `livePitch` — punkty pitchu per gracz `{ [playerId]: PitchPoint[] }`
- `liveScore` / `liveSegmentScores` — wynik i segmenty
- `liveCombo` — stan kombo (current, max, bonus)
- `liveVerseRatings` — oceny per zwrotka
- `transcriptionMatches` — porównanie transkrypcji AI z tekstem
- `recordings` — nagrania per gracz (Blob)

## Detekcja pitchu

### Algorytmy
| Algorytm | Tryb | Opis |
|----------|------|------|
| **autocorr** (UltrastarWP) | Lokalny | Autokorelacja w przeglądarce (Web Audio API) |
| **pitchy** | Lokalny | Biblioteka pitchy — FFT + autokorelacja |
| **crepe** | Streaming (WS) | Sieć neuronowa CREPE, serwer Python |
| **librosa** | Streaming (WS) | Algorytm pYIN z librosa, serwer Python |

### Przepływ detekcji pitchu

1. **AudioRecorder** — przechwytuje strumień mikrofonu via `getUserMedia`
   - Zastosowane constrainty: `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`
   - Opcjonalny GainNode (wzmocnienie mikrofonu)
   - Opcjonalny monitor (odsłuch przez głośniki)
2. **startLocalPitch** (autocorr/pitchy) — pętla RAF:
   - Pobieranie danych z AnalyserNode (`getFloatTimeDomainData`)
   - Opcjonalne okno Hanninga
   - Obliczanie RMS → porównanie z progiem ciszy
   - Detekcja pitchu (autokorelacja lub pitchy)
   - Próg jasności (clarity threshold) — konfigurowalny
   - Wygładzanie (rolling average z ostatnich N ramek)
   - Histereza (N ramek ciszy przed zerowaniem)
3. **startStreamingPitch** (crepe/librosa) — WebSocket:
   - Wysyłanie fragmentów audio do serwera
   - Odbieranie wyników pitchu
   - Automatyczny fallback do lokalnego pitchy przy błędach WS

### Ustawienia mikrofonu (per-device)

Wszystkie ustawienia są ładowane z backendu (`GET /api/user/microphones`) i stosowane
zarówno w trybie podglądu (AudioPitchLevel) jak i podczas śpiewania:

| Ustawienie | Typ | Domyślna | Opis |
|-----------|-----|----------|------|
| `micGain` | number | 0 | Wzmocnienie (0 = brak, 1 = jedność, >1 = podbicie) |
| `rmsThreshold` | number | 0.02 | Próg ciszy RMS |
| `pitchThreshold` | number | 0.6 | Próg jasności detekcji (clarity) |
| `offsetMs` | number | 0 | Korekta latencji mikrofonu (ms) |
| `smoothingWindow` | number | 0 | Liczba ramek do uśredniania |
| `hysteresisFrames` | number | 0 | Ramki ciszy przed zerowaniem pitchu |
| `useHanning` | boolean | false | Stosowanie okna Hanninga |
| `monitorEnabled` | boolean | false | Odsłuch mikrofonu |
| `monitorVolume` | number | 100 | Głośność odsłuchu (0–100) |

## Scoring

### Tryby trudności
- **easy** — szersza tolerancja pitchu, mniej not
- **normal** — standardowe wymagania
- **hard** — ścisła tolerancja, bonus za precyzję

### System scoringu
1. **Segment scoring** — każda nuta porównywana z detekcją pitchu
2. **Combo system** — kolejne trafione nuty budują kombo
3. **Verse ratings** — ocena per zwrotka (Poor/OK/Good/Great/Perfect)
4. **Gold notes** — specjalne nuty z podwójnymi punktami
5. **Live scoring** — wynik aktualizowany w czasie rzeczywistym via WS

### Transkrypcja AI
Podczas śpiewania co ~10 sekund wysyłany jest fragment nagrania do
`POST /api/ai/audio/transcribe`. Transkrybowany tekst jest porównywany
z oczekiwanym tekstem piosenek (word overlap ratio). Wynik wyświetlany
jest jako dyskretny badge (🎤 XX%) w prawym górnym rogu.

## Tryby gry

| Tryb | Opis |
|------|------|
| `normal` | Standardowy karaoke z timeline'em i tekstem |
| `demo` | Tryb demonstracyjny |
| `no-timeline` | Bez wizualizacji pitchu |
| `no-lyrics` | Bez wyświetlania tekstu |
| `no-music` | Bez podkładu muzycznego |
| `instrumental` | Tylko muzyka instrumentalna |
| `blind` | Bez żadnych wizualizacji |
| `blind-no-timeline` | Blind + bez timeline |
| `blind-instrumental` | Blind + instrumental |
| `editor` | Tryb edytora |
| `pad` | Tryb pad (rytmiczny) |

## Format plików UltraStar

```
#TITLE:Tytuł piosenki
#ARTIST:Wykonawca
#BPM:300
#GAP:5000
#GENRE:Rock
: 0 5 60 Tekst
: 5 3 62 nu
* 8 4 65 ty (złota nuta)
- 12        (przerwa/nowa linia)
E           (koniec)
```

- `:` — normalna nuta (start, czas_trwania, pitch, tekst)
- `*` — złota nuta (podwójne punkty)
- `F` — nuta freestyle (nie oceniana)
- `-` — przerwa / separator linii
- `E` — koniec pliku
