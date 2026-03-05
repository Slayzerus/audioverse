# Backend requirements — Radio + NoteRiver pitch mode

## 1. Stream proxy (WYMAGANE do działania FFT)

### Endpointy

| Metoda | Endpoint | Auth | Opis |
|--------|----------|------|------|
| `GET` | `/api/radio-stream` | 🔓 publiczny | Stream audio domyślnej stacji (chunked) |
| `GET` | `/api/radio-stream?stationId={id}` | 🔓 publiczny | Stream wybranej stacji |
| `GET` | `/api/radio-stream/default` | 🔓 publiczny | Info o domyślnej stacji |
| `GET` | `/api/radio-stream/stations` | 🔓 publiczny | Lista dostępnych stacji |

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

### Wymagane nagłówki odpowiedzi streamu
```
Content-Type: audio/mpeg
Access-Control-Allow-Origin: *
Cache-Control: no-cache, no-store
Transfer-Encoding: chunked
```

### Zachowanie przy błędach
- `502` → upstream niedostępny
- `404` → stacja nie istnieje lub nieaktywna
- Frontend fallback: bezpośredni URL stacji (bez FFT, bo CORS zablokuje Web Audio API)

### Zachowanie frontendu (RadioContext.tsx)
- Pobiera domyślną stację z `/api/radio-stream/default`
- Tworzy `Audio` z `crossOrigin = 'anonymous'` i podłącza do `AudioContext + AnalyserNode`
- Jeśli endpoint zwróci błąd → fallback na bezpośredni URL (tylko odtwarzanie, bez FFT, nuty NoteRiver zostają losowe)
- Zmiana stacji: `audio.src = stacja.proxyUrl; audio.play()`

---

## 2. WebSocket pitch detection (OPCJONALNE — furtka gotowa)

> Używane gdy `pitchSource = 'ws'` w `RadioContext.tsx`.  
> Domyślnie wyłączone — frontend używa trybu `'fft'` (kliencki FFT).  
> Przełączenie: zmień jeden string w `src/contexts/RadioContext.tsx`.

### Endpoint
```
WS /api/radio-pitch
```

### Protokół — wiadomości z serwera (JSON, ~co 80–150 ms)
```jsonc
{
  "midi":    67,      // MIDI note number (float, np. 66.8 — frontend zaokrągla)
  "hz":      392.0,   // częstotliwość fundamentalna w Hz (informacyjnie)
  "clarity": 0.75     // pewność detekcji, 0.0–1.0
                      // frontend odrzuca wpisy z clarity < 0.38
}
```

### Zadanie serwera
1. Subskrybuje strumień Classic FM (ten sam upstream)
2. Chunk po chunku przepuszcza przez algorytm pitch detection (np. `pyin` z librosa, `aubio`, lub FFT peak)
3. Co ~100ms wysyła JSON jak powyżej
4. Gdy cisza / brak sygnału / polyphonic chaos → wysyła `{ "midi": null }` lub nie wysyła nic (frontend sam obsłuży timeout)

### Konwersja Hz → MIDI (po stronie serwera)
```python
import math
midi = 12 * math.log2(hz / 440.0) + 69
```

### Rekomendowane narzędzia
| Stack | Biblioteka |
|-------|-----------|
| Python | `librosa` (pyin), `aubio`, `crepe` |
| Node.js | `pitchfinder`, własne FFT (fft.js) |

### Uwagi dotyczące jakości
- Classic FM to muzyka **polyfonic** (orkiestra) — żaden algorytm nie da 100% dokładności
- `pyin` (librosa) radzi sobie z wielodźwiękami lepiej niż prosta autokorelacja
- Wystarczy wyciągnąć dominującą melodię / sopran — efekt wizualny będzie satysfakcjonujący nawet przy niedokładnościach
- Zakres interesujących nut na staffie NoteRiver: **MIDI 64–77** (E4–F5, treble clef)

---

## 3. Podsumowanie priorytetów

| # | Endpoint | Priorytet | Bez tego |
|---|----------|-----------|----------|
| 1 | `GET /api/radio-stream` | **Krytyczny** | FFT nie działa (CORS), radio gra ale nuty są losowe |
| 2 | `WS /api/radio-pitch` | Opcjonalny | Frontend używa klientzkiego FFT (tryb 'fft') |

---

## 4. Testy manualne

### Weryfikacja stream proxy
```bash
curl -I http://localhost:<port>/api/radio-stream
# Oczekiwane: 200, Content-Type: audio/mpeg, Access-Control-Allow-Origin: *

curl http://localhost:<port>/api/radio-stream --output test.mp3 --max-time 3
# Oczekiwane: plik MP3, ~48 kB/s
```

### Weryfikacja WebSocket pitch
```js
// w konsoli przeglądarki lub Node.js
const ws = new WebSocket('ws://localhost:<port>/api/radio-pitch');
ws.onmessage = e => console.log(JSON.parse(e.data));
// Oczekiwane: { midi: ~65-77, hz: ~330-740, clarity: 0.4-0.9 } co ~100ms
```
