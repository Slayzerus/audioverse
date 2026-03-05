# Gry i interakcje — Frontend

## Tryb Pad (Rytmiczny)

### PadNotePlayer (`scripts/karaoke/padNotePlayer.ts`)
Silnik gry rytmicznej inspirowanej Guitar Hero / Rock Band.

**Funkcje:**
- Generowanie nut na ścieżkach (lanes) z piosenek UltraStar
- Timing judgment: Perfect / Good / OK / Miss
- Trudność: easy / normal / hard (zmienia okna czasowe)
- Feedback wizualny per trafienie

```typescript
interface PadLane {
    id: number;
    label: string;
    key: string;       // klawisz klawiatury
}

interface PadNoteEvent {
    laneId: number;
    time: number;       // czas w sekundach
    duration: number;   // czas trwania
    pitch: number;
}

interface PadHitFeedback {
    laneId: number;
    judgment: 'perfect' | 'good' | 'ok' | 'miss';
    score: number;
}
```

### Sterowanie
- Klawiatura: przypisane klawisze per lane (np. D, F, J, K)
- Gamepad: wsparcie kontrolerów (GamepadNavigationContext)

## AI Jurorzy

### System oceniania
AI jurorzy reagują na wykonanie w czasie rzeczywistym:
- Wyrazy twarzy (emoji) zmieniają się w zależności od scoringu
- Animowane reakcje na kombo, verse ratings
- Konfigurowalny panel jurorów (showJurors prop)

### Scoring Bus
```typescript
import { scoreBus } from '../../animations/karaokeIntegration';
scoreBus.push(scoreValue);  // emituje zdarzenie
```

## Quiz muzyczny

Tryb quizowy do rozpoznawania piosenek:
- Odtwarzanie fragmentu → zgadywanie tytułu/artysty
- Wieloosobowy concurring mode
- Tabela wyników

## Imprezy karaoke (Party Mode)

### Tworzenie imprezy
```typescript
postCreateParty({
    name: 'Karaoke Night',
    type: 'InPerson',
    access: 'Public',
});
```

### Rundy
Każda impreza składa się z rund (piosenek):
```typescript
postAddRound(partyId, {
    songId: 42,
    playerIds: [1, 2, 3],
});
```

### Ranking
```typescript
const topSingings = await fetchTopSingings(songId);
// → [{ userId, playerName, score, createdAt }]
```

## WebRTC — Multiplayer

### rtcService
Peer-to-peer komunikacja między graczami:
- Przesyłanie strumieni audio
- Synchronizacja pitchu w czasie rzeczywistym
- Wyświetlanie timeline'ów zdalnych graczy

```typescript
const rtcService = {
    connect: (roomId: string) => void,
    disconnect: () => void,
    sendPitch: (points: PitchPoint[]) => void,
    onRemotePitch: (callback) => void,
};
```

### Timeline zdalnych graczy
- Osobne ścieżki pitchu per zdalny gracz
- Wyświetlanie latencji (`remoteLatencyMs`)
- Toggle widoczności (`showRemoteTimelines`)
- Kompaktowy widok (`compactTimelines`)
