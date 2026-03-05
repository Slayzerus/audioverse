# Animated Person — system animowanych postaci

System proceduralnej animacji postaci oparty na SVG z kinematyką odwrotną (IK), językiem choreografii (DSL), symulacją widowni, reakcjami jurorów na wyniki śpiewania, edytorem wizualnym i biblioteką kształtów.

## Architektura

```
components/animations/
 ├─ AnimatedPerson.tsx         — 407-liniowy renderer SVG z wariantami
 ├─ characterTypes.ts          — typy postaci i części ciała
 ├─ animationHelper.ts         — narzędzia animacji
 ├─ choreoDSL.ts               — język opisu choreografii
 ├─ choreography.ts            — system choreografii
 ├─ AudiencePrograms.ts        — programy zachowań widowni
 ├─ karaokeIntegration.ts      — scoreBus integracja z jurorami
 ├─ BodyRenderer.tsx           — renderer ciała
 ├─ AnimatedPersonEditor.tsx   — edytor wizualny postaci
 ├─ Jurors.tsx                 — panel jurorów
 ├─ Audience.tsx               — symulacja widowni
 ├─ rig/                       — 8 plików kinematyki odwrotnej
 │   ├─ ik.ts                  — algorytm IK
 │   ├─ rigTypes.ts            — typy rigów
 │   ├─ rigMath.ts             — matematyka 2D (kąty, dystanse)
 │   ├─ poseOps.ts             — operacje na pozach
 │   ├─ presets.ts             — gotowe pozy
 │   ├─ RiggedBody.tsx         — renderowany rig SVG
 │   ├─ RigPlayer.tsx          — odtwarzacz animacji rigu
 │   └─ choreoRigBridge.ts     — most choreografia → rig
 └─ shapes/                    — 10 kategorii kształtów
     ├─ arms.tsx               — warianty ramion
     ├─ eyes.tsx               — warianty oczu
     ├─ hair.tsx               — warianty fryzur
     ├─ heads.tsx              — warianty głów
     ├─ headwear.tsx           — nakrycia głowy
     ├─ legs.tsx               — warianty nóg
     ├─ mouths.tsx             — warianty ust
     ├─ noses.tsx              — warianty nosów
     ├─ outfits.tsx            — stroje
     └─ torsos.tsx             — warianty torsów
```

## Renderer SVG

`AnimatedPerson.tsx` (407 linii) — proceduralny renderer postaci:
- Generowanie SVG na podstawie parametrów postaci
- Warianty: wiele kombinacji części ciała
- Animacja pozycji kończyn z interpolacją
- Kolorowanie per-element (skóra, ubrania, włosy)

## System IK (Kinematyka odwrotna)

Katalog `rig/` zawiera pełny system IK 2D:

| Plik | Opis |
|---|---|
| `ik.ts` | Algorytm IK (łańcuch kości, ograniczenia kątowe) |
| `rigTypes.ts` | Typy: `Bone`, `Joint`, `Rig`, `Pose`, `IKTarget` |
| `rigMath.ts` | Matematyka: kąty, dystanse, interpolacja, clamp |
| `poseOps.ts` | Operacje na pozach: blend, lerp, mirror, additive |
| `presets.ts` | Gotowe pozy: stanie, chodzenie, taniec, siedząc |
| `RiggedBody.tsx` | Komponent SVG renderujący rig z kośćmi |
| `RigPlayer.tsx` | Odtwarzacz animacji: timeline poz z interpolacją |
| `choreoRigBridge.ts` | Most między choreoDSL a systemem rigu |

### Pipeline IK

```
Cel (IKTarget: x, y)
  → ik.solve(łańcuch, cel)
  → iteracja CCD/FABRIK
  → aktualizacja kątów kości
  → renderowanie SVG elementów
```

## Język choreografii (choreoDSL)

`choreoDSL.ts` definiuje DSL (Domain Specific Language) do opisywania choreografii:

```typescript
// Przykład programu choreografii
const clapping: ChoreoProgram = [
  { pose: 'handsUp', duration: 200 },
  { pose: 'handsDown', duration: 200 },
  { repeat: true }
];
```

Elementy DSL:
- **Pozy** — przejścia między predefiniowanymi pozami
- **Duracja** — czas trwania w ms
- **Powtórzenie** — zapętlenie sekwencji
- **Warianty** — losowe warianty w sekwencji
- **Blending** — płynne przejścia z wagami

## Programy widowni

`AudiencePrograms.ts` — predefiniowane programy zachowań:
- **Idle** — lekkie kołysanie
- **Clapping** — klaskanie w rytm
- **Cheering** — dopingowanie (ręce w górę)
- **Wave** — fala meksykańska
- **Dancing** — taniec z wariantami

`Audience.tsx` renderuje grupę postaci z różnymi programami zachowań synchronizowanymi z muzyką.

## Jurorzy i integracja z karaoke

`Jurors.tsx` — panel animowanych jurorów reagujących na wyniki śpiewania:
- Wyświetlanie 3-5 jurorów z różnymi osobowościami
- Reakcje na `scoreBus` events z `karaokeIntegration.ts`

`karaokeIntegration.ts` — most między scoringiem karaoke a animacjami:
- `attachScoreReactions()` — podłączenie do strumienia wyników
- Reakcje zależne od dokładności (perfect → entuzjazm, miss → rozczarowanie)
- Smoothing reakcji (nie reagują na każdą nutę)

## Kształty (10 kategorii)

Każdy plik w `shapes/` eksportuje tablicę wariantów SVG:

| Kategoria | Plik | Warianty |
|---|---|---|
| Ramiona | `arms.tsx` | Proste, zgięte, szerokie |
| Oczy | `eyes.tsx` | Okrągłe, migdałowe, zamknięte |
| Fryzury | `hair.tsx` | Krótkie, długie, kręcone, łyse |
| Głowy | `heads.tsx` | Owalne, okrągłe, kwadratowe |
| Nakrycia | `headwear.tsx` | Czapki, kapelusze, opaski |
| Nogi | `legs.tsx` | Proste, zgięte, szerokie |
| Usta | `mouths.tsx` | Uśmiech, neutralne, otwarte |
| Nosy | `noses.tsx` | Mały, duży, zadarty |
| Stroje | `outfits.tsx` | T-shirt, garnitur, sukienka |
| Torsy | `torsos.tsx` | Szczupły, atletyczny, masywny |

## Edytor postaci

`AnimatedPersonEditor.tsx` — wizualny edytor:
- Wybór wariantów dla każdej kategorii
- Podgląd na żywo
- Paleta kolorów (skóra, ubrania, włosy)
- Testowanie animacji/choreografii
- Zapis/eksport konfiguracji postaci

## Routing

| Ścieżka | Komponent |
|---|---|
| `/characters` | `AnimatedPersonsPage.tsx` |
