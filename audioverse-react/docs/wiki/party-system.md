# System imprez (Party)

System społecznościowy do organizowania imprez karaoke: tworzenie/dołączanie do imprez, udostępnianie QR kodem, zarządzanie rundami, zatwierdzanie uczestników, czat w czasie rzeczywistym, komentarze i zdjęcia, wybór gier i punktacja, propozycje terminów, lokalizacje i atrakcje.

## Architektura

```
pages/party/
 ├─ PartiesPage.tsx           — lista imprez
 ├─ PartyPage.tsx             — widok szczegółów imprezy (402 linii po dekompozycji)
 ├─ usePartyPage.ts           — hook z logiką biznesową (530 linii)
 ├─ JoinPartyPage.tsx         — strona dołączania (QR/kod)
 ├─ KaraokeRoundPage.tsx      — runda karaoke
 ├─ KaraokeSongBrowserPage.tsx — przeglądarka piosenek
 ├─ KaraokePlaylistPage.tsx   — playlista karaoke
 └─ DancePage.tsx             — strona tańca

components/controls/party/  (25+ komponentów)
 ├─ PartyHeader.tsx           — nagłówek imprezy
 ├─ PartyNavbar.tsx           — nawigacja tabularna
 ├─ PartySettings.tsx         — ustawienia imprezy
 ├─ PartyChat.tsx             — czat w czasie rzeczywistym
 ├─ PartyQRCode.tsx           — kod QR (inline + fullscreen)
 ├─ PermissionsPanel.tsx      — uprawnienia uczestników
 ├─ RoundsList.tsx            — lista rund
 ├─ RoundCard.tsx             — karta rundy
 ├─ RoundActions.tsx          — akcje rundy
 ├─ ParticipantsPanel.tsx     — lista uczestników
 ├─ ParticipantsApprovalPanel.tsx — zatwierdzanie zgłoszeń
 ├─ GamePicksPanel.tsx        — wybór gier
 ├─ GameSessionScoringPanel.tsx — punktacja sesji gier
 ├─ GameSettingsPanel.tsx     — ustawienia gier
 ├─ KaraokeSongPicksPanel.tsx — wybór piosenek karaoke
 ├─ SongPicksPanel.tsx        — wybór piosenek
 ├─ DateProposalsPanel.tsx    — propozycje terminów
 ├─ EventCommentsPanel.tsx    — komentarze do wydarzenia
 ├─ EventPhotosPanel.tsx      — zdjęcia z wydarzenia
 ├─ LocationPicker.tsx        — wybór lokalizacji
 ├─ AttractionPicker.tsx      — wybór atrakcji
 ├─ AttractionVotingPanel.tsx — głosowanie na atrakcje
 └─ DatePresets.tsx           — presety terminów
```

## Tworzenie imprezy

`CreatePartyForm.tsx` / `PartyForm.tsx`:
- Nazwa, opis, data
- Tryb dołączania: otwarty / za zatwierdzeniem
- Limity uczestników
- Ustawienia gier (tryb, rundy, czas)

## QR kod i dołączanie

`PartyQRCode.tsx` — generowanie kodu QR (`qrcode.react`):
- Widok inline w nagłówku imprezy
- Tryb fullscreen modal (obrót telefonu)
- Link kopiowany do schowka
- `JoinPartyPage.tsx` — strona dla gości skanujących QR

## Hook `usePartyPage` (530 linii)

Cała logika biznesowa strony imprezy:
- **Stan**: uczestnicy, rundy, gry, komentarze, zdjęcia, propozycje terminów
- **Mutacje**: dodawanie rund, zatwierdzanie uczestników, głosowanie na atrakcje
- **Efekty**: polling aktualizacji, WebSocket powiadomienia
- **Computed**: filtrowane listy, statystyki, uprawnienia

## Zarządzanie rundami

Rundy karaoke tworzone i zarządzane przez API:
- Lista rund w `RoundsList.tsx` z kartami `RoundCard.tsx`
- Akcje rundy: start/pauza/zakończenie w `RoundActions.tsx`
- Breadcrumb nawigacja w `KaraokeRoundPage.tsx`

## Ustawienia gier

`GameSettingsPanel.tsx` w zakładce "Games" na PartyPage:
- **Tryby**: Classic, Blind, Elimination, Relay, Freestyle
- Max rund, czas na rundę
- Motyw kolorystyczny, czcionka, tło
- Punktacja i presety trudności

## Wybór piosenek multiplayer

`SongSelectionModeManager.tsx` z 4 trybami:
1. **freeForAll** — wszyscy wybierają jednocześnie
2. **roundRobin** — gracze po kolei (timer, auto-advance)
3. **hostOnly** — tylko host wybiera
4. **firstCome** — wyścig z odliczaniem 3..2..1

Widoczne w `KaraokeSongBrowserPage.tsx` gdy >1 gracz.

## Czat i interakcje

- `PartyChat.tsx` — czat w czasie rzeczywistym (WebSocket/SignalR)
- `EventCommentsPanel.tsx` — komentarze do wydarzenia
- `EventPhotosPanel.tsx` — galeria zdjęć z wydarzenia
- `DateProposalsPanel.tsx` — propozycje i głosowanie na terminy
- `AttractionVotingPanel.tsx` — głosowanie na atrakcje

## Atrakcje

`apiPartyAttractions.ts` z feature flagą `VITE_USE_MOCK_ATTRACTIONS`:
- Mock/localStorage — tryb domyślny (demo)
- Real API — `/api/events/{id}/attractions`
- Przełączanie przez zmienną środowiskową

## Kontakty

Zarządzanie kontaktami społecznymi (przyjaciele/współgracze):
- `ContactsPage.tsx` — lista kontaktów
- `ContactDetailPanel.tsx` — panel szczegółów
- `apiContacts.ts` + `modelsContacts.ts` — API i modele

## API

| Moduł | Endpointy |
|---|---|
| `apiEvents.ts` | CRUD imprez, uczestnicy, zatwierdzenia |
| `apiPartyAttractions.ts` | Atrakcje (mock/real) |
| `apiEventBilling.ts` | Rozliczenia |
| `apiEventComments.ts` | Komentarze |
| `apiEventPhotos.ts` | Zdjęcia |
| `apiEventPolls.ts` | Ankiety |
| `apiGameSessions.ts` | Sesje gier |
| `apiKaraokeSessions.ts` | Sesje karaoke |
| `apiContacts.ts` | Kontakty |

## Routing

| Ścieżka | Komponent |
|---|---|
| `/parties` | `PartiesPage.tsx` |
| `/parties/:partyId` | `PartyPage.tsx` |
| `/rounds` | `KaraokeRoundPage.tsx` |
| `/join` | `JoinPartyPage.tsx` |
| `/contacts` | `ContactsPage.tsx` |
