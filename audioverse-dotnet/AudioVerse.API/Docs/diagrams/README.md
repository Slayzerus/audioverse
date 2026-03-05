# AudioVerse - Diagramy systemu (.drawio)

> Pliki `.drawio` mozna otworzyc w:
> - [draw.io (app.diagrams.net)](https://app.diagrams.net/)
> - VS Code z rozszerzeniem "Draw.io Integration"

---

## Spis diagramow

| # | Plik | Opis |
|---|------|------|
| 01 | `01-system-architecture.drawio` | Architektura systemu - klienci, Nginx, backend, serwisy AI, CI/CD |
| 02 | `02-data-model-core.drawio` | Model danych podstawowych - UserProfile, Event, KaraokeSession, Singing |
| 03 | `03-event-lifecycle.drawio` | Cykl zycia wydarzenia - swimlane (Organizator, Uczestnik, Gracz) + diagram stanow |
| 04 | `04-signalr-realtime.drawio` | Komunikacja czasu rzeczywistego - 6 hubow SignalR, szczegoly KaraokeHub |
| 05 | `05-cicd-pipeline.drawio` | Potok CI/CD - etapy Azure DevOps, Docker Hub |
| 06 | `06-auth-jwt-flow.drawio` | Autoryzacja - rejestracja, logowanie, tokeny JWT, middleware, role |
| 07 | `07-data-model-events.drawio` | Podzasoby wydarzen - zaproszenia, menu, atrakcje, media, ligi, zaklady |
| 08 | `08-cqrs-architecture.drawio` | Czysta architektura + CQRS - warstwy, komendy/zapytania, MediatR |
| 09 | `09-karaoke-session-flow.drawio` | Przeplyw karaoke - 5 faz z mapowaniem na encje |
| 10 | `10-data-model-audio-radio-editor.drawio` | Audio, Radio, Edytor, Media - Utwor/Artysta/Album, plik karaoke |
| 11 | `11-docker-containers.drawio` | Docker Compose - kontenery, porty, serwisy AI |
| 12 | `12-api-areas-controllers.drawio` | Obszary i kontrolery API - Wydarzenia, Karaoke, Gry, Tozsamosc, Radio |
| 13 | `13-laboratory-pipeline-flow.drawio` | Potok laboratoryjny - 7 faz, model danych, API historii eksperymentow |
| auto | `auto-data-model.drawio` | Automatycznie wygenerowany diagram ER z atrybutow [DiagramNode] |

---

## 🤖 Automatyczna generacja diagramów

Diagram `auto-data-model.drawio` jest generowany automatycznie po każdym buildzie przez `AudioVerse.DiagramGenerator`.

### Jak oznaczyć encję do diagramu

```csharp
using AudioVerse.Domain.Diagrams;

[DiagramNode("Events", FillColor = "#d5e8d4", StrokeColor = "#82b366", 
    Icon = "📅", Description = "Core event entity")]
public class Event
{
    // Właściwości proste (int, string, DateTime, enum) 
    // pojawią się automatycznie na diagramie

    [DiagramRelation(Label = "N:1")]
    public UserProfile? Organizer { get; set; }  // → strzałka do UserProfile

    [DiagramIgnore]
    public string? InternalField { get; set; }   // → pomijane
}
```

### Dostępne atrybuty

| Atrybut | Cel | Cel docelowy |
|---------|-----|-------------|
| `[DiagramNode("Group")]` | Dodaje encję do diagramu w danej grupie | Klasa |
| `[DiagramRelation]` | Rysuje strzałkę relacji do innej encji | Właściwość nawigacyjna |
| `[DiagramIgnore]` | Wyklucza z diagramu | Klasa lub właściwość |

### Parametry `DiagramNode`

| Parametr | Domyślnie | Opis |
|----------|-----------|------|
| `Group` | (wymagany) | Nazwa grupy/modułu (np. "Events", "Karaoke") |
| `FillColor` | `#f5f5f5` | Kolor wypełnienia hex |
| `StrokeColor` | `#666666` | Kolor obramowania hex |
| `Icon` | `""` | Emoji obok nazwy |
| `Description` | `""` | Opis pod nazwą klasy |

### Uruchomienie ręczne

```bash
dotnet run --project AudioVerse.DiagramGenerator -- "AudioVerse.API/Docs/diagrams/auto-data-model.drawio"
```

### Post-build (domyślnie włączone)

Diagram generowany jest automatycznie po buildzie projektu `AudioVerse.API`.  
Wyłączenie: `dotnet build -p:GenerateDiagrams=false`

### Integracja z React frontend

Generator tworzy dwa pliki:
- `auto-data-model.drawio` — do draw.io / VS Code
- `auto-data-model.json` — lekki JSON do konsumpcji przez React

**API endpointy** (admin-only):

| Endpoint | Opis |
|----------|------|
| `GET /api/admin/diagrams` | Lista wszystkich diagramów |
| `GET /api/admin/diagrams/data-model` | JSON do renderingu |
| `GET /api/admin/diagrams/data-model/drawio` | Plik .drawio do pobrania |

**React komponent**: `src/pages/admin/DataModelDiagram.tsx`  
**Route**: `/admin/diagrams`

Komponent SVG — zero zewnętrznych zależności:
- 🔍 Wyszukiwanie encji / propertes
- 🖱️ Pan (Shift+drag) + zoom (scroll)
- 📋 Panel detali po kliknięciu węzła
- 🔗 Strzałki relacji z labelami

Alternatywnie, jeśli potrzeba bardziej zaawansowanego renderingu:
```bash
npm install @xyflow/react    # React Flow — drag & drop, minimap, controls
npm install dagre             # auto-layout algorytm
```

---

## 🔑 Kluczowe koncepty widoczne na diagramach

### Rozdzielenie User vs Player
- **UserProfile** (user) → rejestruje się na event (`EventParticipant`)
- **UserProfilePlayer** (gracz) → przypisywany do sesji karaoke (`KaraokeSessionPlayer`)
- Gracz NIE jest wymagany do RSVP na event

### Warstwy architektury
```
API (Controllers, Hubs, Middleware)
  ↓ MediatR
Application (Commands, Queries, Handlers)
  ↓ interfaces
Domain (Entities, Enums, IRepository)
  ↑ implements
Infrastructure (EF DbContext, Repositories, External APIs)
```

### SignalR Hubs
| Hub | Endpoint | Cel |
|-----|----------|-----|
| KaraokeHub | `/hubs/karaoke` | Lobby, chat, WebRTC, timeline, scoring |
| RadioHub | `/hubs/radio` | Streaming, chat, reactions |
| EditorHub | `/hubs/editor` | Collaborative audio editing |
| NotificationHub | `/hubs/notifications` | Push notifications |
| AdminHub | `/hubs/admin` | Audit log stream |
| ModerationHub | `/hubs/moderation` | Content moderation |

---

## 🖥️ Wyświetlanie na froncie

Do wyświetlania w React można użyć:
```bash
npm install @nicholasgasior/drawio-viewer
# lub
npm install mxgraph
```

Lub prostszy sposób — iframe z draw.io viewer:
```html
<iframe
  src="https://viewer.diagrams.net/?url=URL_DO_PLIKU.drawio"
  width="100%"
  height="600"
  frameBorder="0"
/>
```
