# Multiplayer i komunikacja w czasie rzeczywistym

Architektura transportu multiplayer: BaseStreamClient (abstrakcyjny lifecycle WS, reconnect, przechwytywanie mikrofonu), LocalTransport (event bus in-memory dla couch co-op), OfflineTransport (kolejka localStorage z auto-flush), WebRTC peer-to-peer audio, SignalR notification hub i hook kolejki offline.

## Architektura

```
utils/
 ├─ BaseStreamClient.ts         — 280 linii, abstrakcyjna klasa bazowa WS
 ├─ multiplayerUtils.ts         — narzędzia multiplayer
 └─ latencyEstimate.ts          — estymacja opóźnień

services/
 ├─ MultiplayerTransport.ts     — IMultiplayerTransport + LocalTransport + OfflineTransport
 ├─ rtcService.ts               — WebRTC peer connections
 └─ notificationHubService.ts   — SignalR hub

hooks/
 └─ useOfflineQueue.ts          — hook kolejki offline

contexts/
 └─ RTCContext.tsx               — kontekst WebRTC
```

## BaseStreamClient

`BaseStreamClient.ts` (280 linii) — abstrakcyjna klasa bazowa wyciągnięta z `crepeStreaming.ts` i `librosaStreaming.ts`, eliminująca ~400 linii duplikacji:

### Wspólna funkcjonalność

- **Lifecycle WebSocket** — connect, disconnect, reconnect
- **Auto-reconnect** — retry z exponential backoff (10 prób)
- **Send queue** — buforowanie wiadomości przy zamkniętym WS
- **Mic capture** — `getUserMedia` z konfiguracją
- **Resample** — konwersja sample rate
- **PCM encode** — kodowanie do formatu PCM
- **AudioWorklet fallback** — `AudioWorkletNode` → `ScriptProcessorNode`

### Metody abstrakcyjne

```typescript
abstract class BaseStreamClient {
  abstract getWsUrl(): string;
  abstract handleMessage(data: MessageEvent): void;
  abstract processAudioFrame(buffer: Float32Array): void;
}
```

### Implementacje

| Klasa | Opis |
|---|---|
| `CrepeStreamClient` | Streaming pitch do serwera CREPE |
| `LibrosaStreamClient` | Streaming do serwera Librosa (pYIN) |

## Transporty multiplayer

`MultiplayerTransport.ts` definiuje interfejs i dwie implementacje:

### IMultiplayerTransport

```typescript
interface IMultiplayerTransport {
  send(event: GameEvent): void;
  onEvent(handler: (event: GameEvent) => void): void;
  connect(): Promise<void>;
  disconnect(): void;
}
```

### LocalTransport — Couch Co-op

Event bus in-memory dla gry na jednym urządzeniu:
- Zero latency — bez transmisji sieciowej
- Synchroniczny dispatch zdarzeń
- Idealny dla 2-4 graczy na jednym ekranie
- Używany w mini-grach i jam session

### OfflineTransport

Kolejka offline z persystencją w localStorage:
- Buforowanie zdarzeń podczas braku połączenia
- Auto-flush po odzyskaniu sieci (`navigator.onLine`)
- Gwarancja dostarczenia (FIFO)
- Bezstratna — żadne zdarzenie nie zostaje utracone

## Hook kolejki offline

`useOfflineQueue.ts`:

```typescript
function useOfflineQueue() {
  return {
    enqueue(event: GameEvent): void;   // dodaj do kolejki
    flush(): Promise<void>;            // wyślij oczekujące
    clear(): void;                      // wyczyść kolejkę
    pending: number;                    // ile czeka
    isOnline: boolean;                  // stan sieci
  };
}
```

- Automatyczny flush gdy `navigator.onLine` zmieni się na `true`
- Ręczny flush/clear
- Licznik oczekujących zdarzeń

## WebRTC

`rtcService.ts` — peer-to-peer audio/data streams:

### Przepływ połączenia

```
Player A                    Signaling Server                Player B
  │                              │                            │
  ├── createOffer() ────────────►│                            │
  │                              ├── offer ──────────────────►│
  │                              │                            │
  │                              │◄───── createAnswer() ──────┤
  │◄─── answer ─────────────────┤                            │
  │                              │                            │
  ├── ICE candidates ──────────►│                            │
  │                              ├── ICE candidates ─────────►│
  │◄── ICE candidates ─────────┤                            │
  │                              │◄── ICE candidates ─────────┤
  │                              │                            │
  ├══════════ P2P Audio/Data ══════════════════════════════╡
```

### Funkcje
- Streaming audio peer-to-peer (mikrofon gracza)
- Data channel dla game events
- ICE candidate negotiation
- Reconnect przy zerwaniu połączenia

## RTCContext

`RTCContext.tsx` — kontekst React zarządzający sesjami WebRTC:
- Lista aktywnych połączeń per
- Stan połączenia (connecting/connected/disconnected)
- Cleanup przy unmount

## SignalR Hub

`notificationHubService.ts` — połączenie z Azure SignalR Service:
- Real-time powiadomienia (nowy gracz, zmiana stanu)
- Implementacja HubConnection
- Auto-reconnect
- Grupowanie po sesji/events

## Estymacja opóźnień

`latencyEstimate.ts`:
- Pomiar RTT (round-trip time) do serwera
- Rolling average ostatnich N pomiarów
- Kompensacja opóźnień w gameplay

## Integracja z karaoke

W `useKaraokeManager.ts`:
- `startStreamingPitch()` — streaming pitch do serwera (CREPE/Librosa)
- Automatyczny fallback z streaming na lokalne pitchy po awarii
- `getPitchServerWsUrl()` — URL WebSocket serwera pitch
- `getSingingScoreLiveWsUrl()` — URL WebSocket live scoring
- Per-player streaming z osobnymi instancjami `BaseStreamClient`

## Bezpieczeństwo

- Wszystkie URL API-relative (nie hardcoded localhost)
- JWT auth dla WebSocket handshake
- Szyfrowanie DTLS dla WebRTC
