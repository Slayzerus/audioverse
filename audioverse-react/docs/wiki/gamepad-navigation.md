# Nawigacja gamepadem

Pełne wsparcie gamepadów/kontrolerów do nawigacji po interfejsie: algorytm nawigacji przestrzennej, pułapki fokusa dla modali, komponent Focusable (5 trybów podświetlenia), mapowanie D-pad/analog/confirm/cancel, fallback na strzałki klawiatury, obsługa dropdownów z gamepadem i logika cooldown/debouncing.

## Architektura

```
contexts/
 └─ GamepadNavigationContext.tsx   — kontekst nawigacji gamepadowej

utils/
 └─ gamepadMapping.ts              — mapowanie przycisków

components/controls/input/settings/
 └─ GamepadController.tsx           — konfiguracja kontrolera

pages/settings/
 └─ ControllerPage.tsx              — strona ustawień kontrolera

components/ui/
 └─ Focusable.tsx                   — komponent fokusa z highlight modes

css/
 └─ GamepadFocusStyle.css           — style podświetlenia
```

## GamepadNavigationContext

Centralny kontekst zarządzający nawigacją gamepadem:

### Nawigacja przestrzenna (Spatial Navigation)

Algorytm znajduje najbliższy element w kierunku D-pad:
1. Pobierz aktualnie sfokusowany element
2. Oblicz BoundingClientRect wszystkich fokusowanych elementów
3. Filtruj po kierunku (góra/dół/lewo/prawo)
4. Wybierz najbliższy (odległość euklidesowa + preferencja osi)

### Pułapki fokusa (Focus Traps)

```typescript
pushFocusTrap(container: HTMLElement): void;
popFocusTrap(): void;
```

- Stosowane w modalach, dropdownach, dialogach
- Nawigacja ograniczona do elementów wewnątrz kontenera
- Stack — zagnieżdżone pułapki (modal w modalu)

### Mapowanie wejść

| Przycisk | Akcja |
|---|---|
| D-pad Up/Down/Left/Right | Nawigacja przestrzenna |
| Left Analog | Nawigacja (z dead zone) |
| A / Cross | Confirm (kliknięcie) |
| B / Circle | Cancel (Escape / Back) |
| Start | Menu / toggle |
| Select | Alternatywna akcja |

### Fallback na klawiaturę

Strzałki klawiatury → ta sama logika nawigacji przestrzennej. Tab nadal działa standardowo.

## Focusable

`Focusable.tsx` — wrapper komponent dodający fokus z podświetleniem:

```typescript
<Focusable highlightMode="glow">
  <MyButton />
</Focusable>
```

### 5 trybów podświetlenia

| Tryb | Opis |
|---|---|
| **outline** (domyślny) | Kolorowy obrys wokół elementu |
| **dim** | Przyciemnienie otoczenia |
| **brighten** | Rozjaśnienie elementu |
| **glow** | Poświata neonowa |
| **scale** | Powiększenie (transform: scale) |

Style w `GamepadFocusStyle.css`:
```css
.focusable--outline:focus { outline: 3px solid var(--bs-primary); }
.focusable--glow:focus { box-shadow: 0 0 12px var(--bs-primary); }
.focusable--scale:focus { transform: scale(1.05); }
```

### Props

```typescript
interface FocusableProps {
  highlightMode?: 'outline' | 'dim' | 'brighten' | 'glow' | 'scale';
  role?: string;          // domyślnie 'group'
  tabIndex?: number;      // domyślnie 0
  onActivate?: () => void; // kliknięcie/Enter/gamepad A
  children: ReactNode;
}
```

~50 użyć w aplikacji. Poszczególne miejsca mogą nadać `role="button"` / `"menuitem"` wg potrzeby.

## Obsługa dropdownów

Dropdowny z gamepadem:
- **Toggle** — przycisk A otwiera/zamyka z cooldownem 600 ms
- **Nawigacja** — D-pad up/down w liście opcji
- **Zamknięcie** — przycisk B zamyka dropdown
- **Delayed close** — 200 ms timeout przed zamknięciem (zapobiega przypadkowym zamknięciom)
- **Keyboard cooldown** — debouncing klawiatury

## Debouncing i cooldowny

- **Gamepad polling** — `requestAnimationFrame` loop
- **Dead zone analog** — konfigurowalny próg (domyślnie 0.2)
- **Cooldown toggle** — 600 ms po otwarciu/zamknięciu dropdownu
- **Navigation repeat** — opóźnienie między powtórzeniami nawigacji

## Integracja

Kontekst jest dostarczany globalnie w `main.tsx` i używany w:
- `Navbar.tsx` — nawigacja między elementami menu
- Modals — automatyczne focus trap
- Dropdowny — gamepad toggle + nawigacja
- Formularze — nawigacja między polami
- Mini-gry — `PlayerLobby.tsx` join/leave z gamepadem

## Routing

| Ścieżka | Komponent |
|---|---|
| `/settings/controller` | `ControllerPage.tsx` |
