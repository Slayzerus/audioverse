# Honest Living — Gra RPG (Phaser)

Pełnoprawna gra 2D RPG osadzona w aplikacji AudioVerse, zbudowana na silniku **Phaser 3** z warstwą klienta w React i zarządzaniem stanem przez **Zustand**.

## Architektura

```
honest-living/
 ├─ engine/                 — silnik gry (Phaser)
 │   ├─ GameManager.ts      — lifecycle wraps Phaser.Game
 │   ├─ EventBus.ts         — globalny bus zdarzeń
 │   ├─ SceneContext.ts     — współdzielony stan między systemami
 │   ├─ AssetManifest.ts    — manifest zasobów (obrazy, sprite, dźwięki)
 │   ├─ scenes/
 │   │   ├─ BootScene.ts    — ładowanie assetów, generowanie fallbacków
 │   │   └─ MainScene.ts    — główna scena, inicjalizacja 20 systemów
 │   └─ systems/            — 20 systemów gry
 ├─ client/                 — warstwa React
 │   ├─ stores/             — 6 store'ów Zustand
 │   ├─ components/
 │   │   ├─ game/           — 14 paneli UI w grze
 │   │   ├─ editors/        — 10 edytorów zasobów/kampanii
 │   │   └─ menu/           — menu główne, formularz postaci
 │   └─ services/
 │       └─ multiplayer/OnlineService.ts
 └─ shared/
     ├─ types/              — 18 plików typów
     └─ data/               — dane gry (przedmioty, broń, rośliny, NPC)
```

## Przepływ scen

1. **BootScene** — ładuje wszystkie assety z `buildAssetManifest()`, generuje fallbackowe tekstury (kafelki wody, kropka gracza), przechodzi do MainScene.
2. **MainScene** — główny orkiestrator. W `create()` tworzy `SceneContext` (współdzielony kontener stanu), następnie inicjalizuje 20 systemów w określonej kolejności. W `update()` deleguje do pętli aktualizacji każdego systemu.

`MainSceneConfig` zawiera: wymiary mapy, seed, trudność, żyzność, listę roślin, definicje spawnu NPC i zoom.

## Systemy silnika (20)

| System | Opis |
|---|---|
| **AnimationSystem** | Rejestracja arkuszy sprite'ów, crossfade animacji, priorytety |
| **AudioSystem** | Efekty dźwiękowe i odtwarzanie muzyki |
| **CameraSystem** | Śledzenie kamery, zoom, granice |
| **CombatSystem** (394 linii) | Ataki, obrażenia, knockback, cooldowny, zmiana broni; cone-based hit detection, koszt staminy, wyświetlanie obrażeń, dane broni (fist/dagger/sword/axe/spear) |
| **EconomySystem** | Inicjalizacja cen z `ITEMS.basePrice`, fluktuacja co 60s, event `economy:pricesUpdated` |
| **EnemyAI** | Maszyna stanów zachowań wrogów |
| **EnemySpawnerSystem** | Spawnowanie wrogów na podstawie strefy/czasu/trudności |
| **FarmingSystem** (333 linii) | Sadzenie, podlewanie, cykle wzrostu, zbieranie plonów, bonus żyzności, ograniczenia sezonowe |
| **HudSystem** | HUD w scenie (paski zdrowia, staminy) |
| **ItemDropSystem** | Drop'y przedmiotów, logika podnoszenia |
| **MapRenderer** | Generowanie i renderowanie mapy kafelkowej |
| **NPCSystem** | Spawnowanie NPC, dialogi, AI |
| **PlayerController** | Ruch gracza, obsługa wejścia przez `InputManager` |
| **ProgressionSystem** | XP, levelowanie, odblokowanie umiejętności |
| **QuestSystem** (177 linii) | Rejestr questów, start/zakończenie, event-driven tracking celów |
| **SurvivalSystem** | Mechaniki przetrwania: głód, pragnienie, stamina |
| **TerritorySystem** | Własność terytoriów i kontrola |
| **TimeSystem** | Cykl dnia/nocy, pory roku |
| **VehicleSystem** | Wsiadanie i jazda pojazdami |
| **ZoneSystem** | Definicje stref, triggery obszarowe |

### Kolejność inicjalizacji (MainScene.create)

1. SceneContext + tuning trudności
2. AnimationSystem → InputManager → ProgressionSystem
3. PlayerController (zależy od InputManager, AnimationSystem)
4. CombatSystem (zależy od AnimationSystem, ProgressionSystem)
5. FarmingSystem (zależy od ProgressionSystem)
6. EnemyAI → MapRenderer → ItemDropSystem → CameraSystem → HudSystem
7. QuestSystem → VehicleSystem → ZoneSystem → EnemySpawnerSystem → NPCSystem
8. Konfiguracja farmingu (lista roślin, tryConsume) i NPC
9. Rejestracja animacji → `.create()` każdego systemu

## Store'y Zustand (6)

| Store | Cel |
|---|---|
| `useGameStore` | Główny stan: `AppMode` (menu/world/character/play/editor/settings), konfiguracja świata, dane postaci, flagi running/paused, zapis. Persystencja w localStorage (`hl-game`). |
| `useInventoryStore` | Zarządzanie ekwipunkiem gracza |
| `useModStore` | Ładowanie i zarządzanie modami |
| `useSettingsStore` | Preferencje użytkownika |
| `useUIStore` | Widoczność paneli UI, stan dialogów |
| `useAssetLibrary` | Przeglądanie i zarządzanie paczkami zasobów |

## Panele UI w grze (14)

`ClockDisplay`, `ConstructionUI`, `ControlsHint`, `CraftingPanel`, `DialogUI`, `HireUI`, `Hotbar`, `Inventory`, `MinigamePanel`, `QuestTracker`, `RealEstateUI`, `StrategyPanel`, `TradeUI`, `ZoomControls`

## Edytory zasobów (10)

`AssetPackManager`, `CampaignEditor`, `CharacterEditor`, `JointEditor`, `ModManager`, `PixelCanvas`, `SpritesheetExporter`, `SpriteViewer`, `UnifiedAssetEditor`, `WorldObjectEditor`

## Typy danych (18 plików)

`assets`, `campaign`, `combat`, `common`, `crafting`, `dialog`, `economy`, `entities`, `farming`, `items`, `multiplayer`, `progression`, `quests`, `saves`, `tiles`, `vehicles`, `world` + barrel `index.ts`

## Multiplayer

`OnlineService.ts` zapewnia multiplayer online z synchronizacją stanu między graczami. Typy multiplayer zdefiniowane w `shared/types/multiplayer.ts`.

## Routing

- `/honest-living` — `HonestLivingPage.tsx` (React.lazy, Phaser chunk ~1.5 MB ładowany dynamicznie)

## Dane gry

Katalog `shared/data/` zawiera definicje:
- Przedmioty i bronie (statystyki, ceny bazowe)
- Przepisy craftingu
- Rośliny (cykle wzrostu, sezon)
- NPC (dialogi, spawny)

## Opis systemu walki

CombatSystem używa cone-based hit detection — atak sprawdza stożek przed graczem. Każda broń ma zasięg, kąt, koszt staminy, cooldown i obrażenia. Knockback proporcjonalny do siły broni. Damage numbers wyświetlane jako floating text.

## System farmingu

FarmingSystem operuje w cyklach:
1. **Sadzenie** — sprawdza czy gracz ma nasiona (callback `tryConsume`)
2. **Podlewanie** — przyspiesza wzrost
3. **Wzrost** — ticki czasowe, modyfikowane żyznością terenu
4. **Zbiory** — yield zależy od żyzności + statusu podlewania
5. **Sezonowość** — pewne rośliny rosną tylko w odpowiednich porach roku
