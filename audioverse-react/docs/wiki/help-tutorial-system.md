# System pomocy i tutoriali

Kontekstowy system pomocy z artykułami dopasowanymi do aktualnej strony, nakładki tutorialowe ze spotlight i krokowymi przewodnikami, przeglądarka wiki i zarządzanie stanem tutoriali przez TutorialContext.

## Architektura

```
help/
 └─ helpContent.ts               — 20+ artykułów pomocy z route matching

contexts/
 └─ TutorialContext.tsx            — kontekst stanu tutoriali

utils/
 └─ tutorialDefinitions.ts        — definicje kroków (8-step editor tour)

components/ui/
 ├─ HelpButton.tsx                 — przycisk "?" na stronie
 ├─ HelpPanel.tsx                  — panel pomocy (Offcanvas)
 └─ TutorialOverlay.tsx            — nakładka tutorialu (CSS Modules)

components/wiki/
 ├─ WikiContent.tsx                — renderowanie treści wiki
 ├─ WikiSearchResults.tsx          — wyniki wyszukiwania
 └─ WikiSidebar.tsx                — sidebar nawigacji wiki

pages/wiki/
 └─ WikiPage.tsx                   — strona przeglądania wiki

scripts/api/
 └─ apiWiki.ts                     — API wiki (CRUD stron)

models/
 └─ modelsWiki.ts                  — typy WikiPage
```

## Artykuły pomocy

`helpContent.ts` — 20+ artykułów z dopasowaniem do aktualnej ścieżki:

```typescript
interface HelpArticle {
  id: string;
  title: string;
  content: string;           // markdown
  routes: string[];           // wzorce route (np. '/audio-editor*')
  relatedTopics?: string[];   // powiązane artykuły
  tags?: string[];
}
```

Logika dopasowania:
1. Pobierz aktualną ścieżkę (`useLocation`)
2. Filtruj artykuły po `routes` (glob matching)
3. Wyświetl kontekstowe artykuły + powiązane tematy

## Przycisk pomocy

`HelpButton.tsx`:
- Stały przycisk `?` w prawym dolnym rogu
- Otwiera `HelpPanel` (Bootstrap Offcanvas)
- Widoczny na wszystkich stronach
- Animacja pulse przy pierwszej wizycie

## Panel pomocy

`HelpPanel.tsx` (Offcanvas):
- Lista kontekstowych artykułów (dopasowanych do strony)
- Wszystkie tematy (pełna lista)
- Powiązane tematy (linkowane)
- Wyszukiwanie w artykułach
- Renderowanie markdown

## TutorialContext

`TutorialContext.tsx` — zarządzanie stanem tutoriali:

```typescript
interface TutorialState {
  isActive: boolean;
  currentStep: number;
  tutorialId: string;
  completedTutorials: string[];
}

interface TutorialContextType {
  state: TutorialState;
  startTutorial(id: string): void;
  nextStep(): void;
  prevStep(): void;
  skipTutorial(): void;
  completeTutorial(): void;
  resetTutorial(id: string): void;
}
```

### Persystencja

Ukończone tutoriale zapisywane w localStorage. Zapobiega ponownemu wyświetlaniu.

### Error guard

Ochrona przed nieprawidłowymi wywołaniami (np. `nextStep` bez aktywnego tutoriala).

### Testy

11 testów: start, next, prev, skip, complete, reset, persist, error-guard.

## Tutorial Overlay

`TutorialOverlay.tsx` (CSS Modules):
- **Spotlight** — wyróżnia docelowy element, przyciemnia resztę
- **Tooltip** — opis kroku z numeracją
- **Nawigacja** — Next/Back/Skip
- **Keyboard** — strzałki, Escape, Enter
- Auto-scroll do docelowego elementu

## Definicje kroków

`tutorialDefinitions.ts` — 8-krokowy tour po Audio Editorze:

| Krok | Element | Opis |
|---|---|---|
| 1 | Cały edytor | Powitanie |
| 2 | DisplayModeSelector | Wybór trybu wyświetlania |
| 3 | Transport controls | Play/Pause/Stop |
| 4 | Warstwy | Zarządzanie warstwami |
| 5 | Zoom/Snap | Zoom i snap |
| 6 | Nagrywanie | Arm track i nagrywanie |
| 7 | Zapis | Zapisywanie projektu |
| 8 | — | Skróty klawiszowe |

Auto-launch przy pierwszej wizycie na stronie edytora.

## Wiki — przeglądarka

### WikiPage

`WikiPage.tsx` — strona przeglądania wiki:
- Rendering markdown (`WikiContent.tsx`)
- Sidebar z drzewem nawigacji (`WikiSidebar.tsx`)
- Wyszukiwanie (`WikiSearchResults.tsx`)

### API Wiki

`apiWiki.ts` — endpointy CRUD:
- `fetchWikiPages()` — lista stron
- `fetchWikiPage(slug)` — pobieranie strony
- `createWikiPage()` / `updateWikiPage()` / `deleteWikiPage()`
- React Query hooks z cache

### Model WikiPage

```typescript
interface WikiPage {
  id: number;
  slug: string;
  title: string;
  contentMarkdown: string;
  category?: string;
  sortOrder: number;
  tags?: string;          // CSV
  icon?: string;          // Lucide icon name
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Dokumentacja wiki

30 stron markdown w `docs/wiki/` + `wiki-seed-manifest.json` do bulk importu. Wszystkie w kategorii "Frontend — React". Format: plain markdown (bez frontmatter), metadane w JSON manifest.

## Routing

| Ścieżka | Komponent |
|---|---|
| `/wiki` | `WikiPage.tsx` |
| `/wiki/:slug` | `WikiPage.tsx` (per-page) |
