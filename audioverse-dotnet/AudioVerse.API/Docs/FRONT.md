## 2. Radio Stream Proxy (NoteRiver)

### Opis

Proxy strumienia audio zewnętrznych stacji radiowych. Pozwala frontendowi podłączyć stream do Web Audio API (FFT/NoteRiver) bez blokady CORS.

### Endpointy

| Metoda | Endpoint | Auth | Opis |
|---|---|---|---|
| `GET` | `/api/radio-stream` | 🔓 publiczny | Stream audio (chunked) |
| `GET` | `/api/radio-stream?stationId={id}` | 🔓 publiczny | Stream wybranej stacji |
| `GET` | `/api/radio-stream/default` | 🔓 publiczny | Info o domyślnej stacji |
| `GET` | `/api/radio-stream/stations` | 🔓 publiczny | Lista stacji do wyboru |

### Domyślna stacja

Bez `stationId` → Classic FM. Konfigurowalne w backendzie.

### `GET /api/radio-stream/default` — odpowiedź

```json
{
  "stationId": 42,
  "name": "Classic FM",
  "streamUrl": "/api/radio-stream?stationId=42"
}
```

### `GET /api/radio-stream/stations?genre=classical` — odpowiedź

```json
{
  "items": [
    {
      "id": 42,
      "name": "Classic FM",
      "countryCode": "GB",
      "genre": "classical",
      "bitrateKbps": 128,
      "logoUrl": null,
      "proxyUrl": "/api/radio-stream?stationId=42"
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 50
}
```

### Użycie w React

```typescript
// 1. Pobierz domyślną stację
const def = await fetch('/api/radio-stream/default').then(r => r.json());

// 2. Podłącz do audio elementu
const audio = new Audio(def.streamUrl);
audio.crossOrigin = 'anonymous';
audio.play();

// 3. Podłącz do Web Audio API (FFT dla NoteRiver)
const ctx = new AudioContext();
const source = ctx.createMediaElementSource(audio);
const analyser = ctx.createAnalyser();
source.connect(analyser);
analyser.connect(ctx.destination);

// 4. Zmiana stacji
async function changeStation(stationId: number) {
  audio.src = `/api/radio-stream?stationId=${stationId}`;
  audio.play();
}
```

### Zachowanie przy błędach

- Jeśli `/api/radio-stream` zwróci `502` → upstream niedostępny
- Jeśli `404` → stacja nie istnieje lub nieaktywna
- Frontend powinien mieć fallback na bezpośredni URL stacji (bez FFT, bo CORS)

### Nagłówki odpowiedzi streamu

```
Content-Type: audio/mpeg
Access-Control-Allow-Origin: *
Cache-Control: no-cache, no-store
Transfer-Encoding: chunked
```
