# Mapa żądań API — PartiesPage / PartyPage / KaraokeRoundPage

> Wygenerowano: 2026-02-25
> Wszystkie URLe relatywne do `API_ROOT` (domyślnie `http://localhost:5000`).

---

## A. PartiesPage → PartiesList

### 1. Pobranie wszystkich eventów (do dropdown'u organizatora)
| | |
|---|---|
| **Hook** | `usePartiesQuery()` |
| **Plik** | `apiKaraokeSessions.ts` → `fetchParties()` |
| **HTTP** | `GET /api/events` |
| **Query key** | `["karaoke", "parties"]` |
| **Kiedy** | Na mount (`staleTime: 60s`) |
| **Po co** | Lista eventów do filtrowania po organizatorze |

### 2. Pobranie filtrowanej listy eventów (główna lista z sortowaniem i paginacją)
| | |
|---|---|
| **Hook** | `useFilteredPartiesQuery(filterRequest)` |
| **Plik** | `apiKaraokeSessions.ts` → `fetchFilteredParties()` |
| **HTTP** | `POST /api/karaoke/filtered/Event` |
| **Body** | `DynamicFilterRequest { Conditions[], Page, PageSize, SortBy, SortDir }` |
| **Query key** | `["karaoke", "parties", "filtered", <filterRequest>]` |
| **Kiedy** | Na mount + zmiana filtru/sortowania/strony |
| **Po co** | Filtrowana, posortowana, stronicowana lista imprez. Zwraca `{ Items, TotalCount }` |

### 3. Wyszukiwanie użytkowników (typeahead organizatora)
| | |
|---|---|
| **Funkcja** | `fetchUserSearch(orgQuery)` — imperatywne wywołanie z `useEffect`, debounce 350ms |
| **Plik** | `apiKaraokeSongs.ts` → `fetchUserSearch()` |
| **HTTP** | `GET /api/karaoke/users/search?term=<query>` |
| **Query key** | brak (imperatywne) |
| **Kiedy** | Gdy użytkownik wpisze ≥2 znaki |
| **Po co** | Podpowiedzi organizatorów |

### 4. Plakaty eventów (obrazki na kartach)
| | |
|---|---|
| **Funkcja** | `buildPosterStyle(party)` — URL w CSS `background-image` |
| **HTTP** | `GET /api/events/{id}/poster` |
| **Query key** | brak (przeglądarka) |
| **Kiedy** | Render każdej karty z posterem |
| **Po co** | Wyświetlenie plakatu imprezy |

---

## B. PartiesPage → CreatePartyForm (modal tworzenia)

### 5. Utworzenie nowego eventu
| | |
|---|---|
| **Hook** | `useCreatePartyMutation()` |
| **Plik** | `apiKaraokeSessions.ts` → `postCreateParty()` |
| **HTTP** | `POST /api/events` (JSON) lub `POST /api/events/with-poster` (multipart) |
| **Invalidacja** | `["karaoke", "parties"]` |
| **Kiedy** | Submit formularza |
| **Po co** | Tworzenie eventu/imprezy |

---

## C. PartyPage → `usePartyPage()` — Queries (automatyczne na mount)

### 6. Pobranie eventu po ID
| | |
|---|---|
| **Hook** | `usePartyQuery(id)` |
| **Plik** | `apiKaraokeSessions.ts` → `fetchPartyById()` |
| **HTTP** | `GET /api/karaoke/get-event/{id}` |
| **Query key** | `["karaoke", "party", id]` |
| **Kiedy** | Na mount |
| **Po co** | Dane imprezy: Title, Description, Status, StartTime, OrganizerId itp. |
| **⚠ UWAGA** | Backend zwraca PascalCase (`Title`) — frontend normalizuje do `title`/`name`. **Nie zwraca listy uczestników!** |

### 7. Pobranie statusu eventu (w tym graczy)
| | |
|---|---|
| **Hook** | `usePartyStatusQuery(id)` |
| **Plik** | `apiKaraokeSessions.ts` → `fetchPartyStatus()` |
| **HTTP** | `GET /api/karaoke/get-event/{id}` ← **ten sam endpoint co #6!** |
| **Query key** | `["karaoke", "party", id, "status"]` |
| **Kiedy** | Na mount (`staleTime: 30s`) |
| **Po co** | Wydobywa pod-obiekt `status` z odpowiedzi eventu. Zawiera `.players[]` = lista uczestników |
| **⚠ UWAGA** | Wynik zależy od tego, co backend zwraca w get-event. Jeśli `status.players` jest pusty/brakuje go — **lista uczestników na froncie też będzie pusta!** To jest główne źródło uczestników dla `ParticipantsPanel`. |

### 8. Pobranie listy piosenek
| | |
|---|---|
| **Hook** | `useSongsQuery()` |
| **Plik** | `apiKaraokeSongs.ts` → `fetchSongs()` |
| **HTTP** | `GET /api/karaoke/filter-songs` |
| **Query key** | `["karaoke", "songs", {}]` |
| **Kiedy** | Na mount (`staleTime: 60s`) |
| **Po co** | Lista piosenek do "Add round" |

### 9. Pobranie zaproszeń do imprezy
| | |
|---|---|
| **Hook** | `useQuery(…)` (inline w `usePartyPage`) |
| **Plik** | `apiKaraokeSessions.ts` → `fetchPartyInvites()` |
| **HTTP** | `GET /api/events/{partyId}/invites` |
| **Query key** | `["karaoke", "party", partyId, "invites"]` |
| **Kiedy** | Na mount (`staleTime: 5min`, `retry: false`) |
| **Po co** | Lista zaproszeń (pending/accepted/rejected) |

---

## D. PartyPage → `usePartyPage()` — Mutations (na akcję użytkownika)

### 10. Aktualizacja eventu
| | |
|---|---|
| **Hook** | `updatePartyMutation` (inline `useMutation`) |
| **Plik** | `apiKaraokeSessions.ts` → `putUpdateParty()` |
| **HTTP** | `PUT /api/events/{id}` (JSON) lub `PUT /api/events/{id}/with-poster` (multipart) |
| **Invalidacja** | `["karaoke", "party", id]` |
| **Kiedy** | Zmiana statusu, dat, access type przez organizatora |
| **Po co** | Zapisanie zmian |

### 11. Dodanie uczestnika (Join)
| | |
|---|---|
| **Hook** | `useAddParticipantMutation()` |
| **Plik** | `apiEvents.ts` → `postAddParticipant()` |
| **HTTP** | `POST /api/events/{eventId}/participants` |
| **Invalidacja** | `["events", eventId, "party"]`, `["karaoke", "party", eventId, "status"]`, `["karaoke", "party", eventId]` |
| **Kiedy** | Klik "Join" / dodanie gracza |
| **Po co** | Dodanie uczestnika do eventu. **Po sukcesie invaliduje status → wymusza re-fetch #7 → odświeża listę graczy** |

### 12. Usunięcie uczestnika
| | |
|---|---|
| **Hook** | `useDeleteParticipantMutation()` |
| **Plik** | `apiKaraokeSessions.ts` → `deleteAssignPlayerFromParty()` |
| **HTTP** | `DELETE /api/karaoke/events/{eventId}/participants/{playerId}` |
| **Invalidacja** | `["karaoke", "parties"]` |
| **Kiedy** | Klik usunięcia gracza |
| **Po co** | Usunięcie gracza z eventu |

### 13. Dodanie rundy
| | |
|---|---|
| **Hook** | `useAddRoundMutation()` |
| **Plik** | `apiKaraokeRounds.ts` → `postAddRound()` |
| **HTTP** | `POST /api/karaoke/add-round` |
| **Invalidacja** | `["karaoke", "parties"]`, `["karaoke", "party", partyId]`, `["karaoke", "party", partyId, "status"]` |
| **Kiedy** | Submit w AddRoundModal |
| **Po co** | Tworzenie rundy w sesji |

### 14. Utworzenie sesji
| | |
|---|---|
| **Hook** | `useAddSessionMutation()` |
| **Plik** | `apiKaraokeSessions.ts` → `postAddSession()` |
| **HTTP** | `POST /api/karaoke/add-session` |
| **Invalidacja** | `["karaoke", "party", partyId]`, `["karaoke", "parties"]` |
| **Kiedy** | Tworzenie nowej sesji karaoke |
| **Po co** | Tworzenie sesji w ramach imprezy |

### 15. Dodanie parta do rundy
| | |
|---|---|
| **Hook** | `useAddRoundPartMutation()` |
| **Plik** | `apiKaraokeRounds.ts` → `postAddRoundPart()` |
| **HTTP** | `POST /api/karaoke/add-round-part` |
| **Invalidacja** | `["karaoke", "parties"]` |
| **Kiedy** | Submit w PartsModal |
| **Po co** | Przypisanie gracza do rundy |

### 16. Dodanie atrakcji
| | |
|---|---|
| **Hook** | `useAddAttractionMutation(id)` |
| **Plik** | `apiPartyAttractions.ts` → `addPartyAttraction()` |
| **HTTP** | `POST /api/events/{partyId}/attractions` *(lub mock localStorage)* |
| **Invalidacja** | `["party", partyId, "attractions"]` |
| **Kiedy** | Wybór typu atrakcji w AttractionPicker |
| **Po co** | Dodanie atrakcji (karaoke, gra planszowa itp.) |

### 17. Wysłanie zaproszenia
| | |
|---|---|
| **Hook** | `sendInviteMutation` (inline) |
| **Plik** | `apiKaraokeSessions.ts` → `postSendPartyInvite()` |
| **HTTP** | `POST /api/invites/events/{partyId}/send` |
| **Invalidacja** | `["karaoke", "party", partyId, "invites"]` |
| **Kiedy** | Klik "wyślij zaproszenie" |
| **Po co** | Zaproszenie użytkownika na imprezę |

### 18. Anulowanie zaproszenia
| | |
|---|---|
| **Hook** | `cancelInviteMutation` (inline) |
| **Plik** | `apiKaraokeSessions.ts` → `postCancelInvite()` |
| **HTTP** | `POST /api/invites/{inviteId}/cancel` |
| **Invalidacja** | `["karaoke", "party", partyId, "invites"]` |
| **Kiedy** | Klik anulowania |
| **Po co** | Cofnięcie zaproszenia |

### 19. Odpowiedź na zaproszenie
| | |
|---|---|
| **Funkcja** | `postRespondInvite()` — imperatywne |
| **Plik** | `apiKaraokeSessions.ts` |
| **HTTP** | `POST /api/invites/{inviteId}/respond?accept={bool}` |
| **Kiedy** | Akceptacja/odrzucenie zaproszenia |
| **Po co** | Odpowiedź na zaproszenie |

---

## E. PartyPage → Sub-komponenty

### 20. Pobranie atrakcji eventu
| | |
|---|---|
| **Hook** | `usePartyAttractionsQuery(partyId)` |
| **Plik** | `apiPartyAttractions.ts` → `fetchPartyAttractions()` |
| **HTTP** | `GET /api/events/{eventId}/attractions` *(lub mock localStorage)* |
| **Query key** | `["party", partyId, "attractions"]` |
| **Kiedy** | Na mount AttractionDetailModal |
| **Po co** | Lista atrakcji imprezy |

### 21. Głosowanie na atrakcję
| | |
|---|---|
| **Hook** | `useVoteAttractionMutation(partyId)` |
| **HTTP** | `POST /api/events/{eventId}/attractions/{id}/vote` |
| **Kiedy** | Klik +1 |

### 22. Usunięcie atrakcji
| | |
|---|---|
| **Hook** | `useDeleteAttractionMutation(partyId)` |
| **HTTP** | `DELETE /api/events/{eventId}/attractions/{id}` |
| **Kiedy** | Klik Delete |

### 23. Zmiana statusu atrakcji
| | |
|---|---|
| **Hook** | `useUpdateAttractionStatusMutation(partyId)` |
| **HTTP** | `PATCH /api/events/{eventId}/attractions/{id}/status` |
| **Kiedy** | Approve/reject przez organizatora |

### 24. Pobranie harmonogramu eventu
| | |
|---|---|
| **Hook** | `useEventScheduleQuery(partyId)` |
| **HTTP** | `GET /api/events/{eventId}/schedule` |
| **Query key** | `["events", eventId, "schedule"]` |
| **Kiedy** | Na mount SessionForm (automatyczne) |
| **Po co** | Sugerowanie czasu startu sesji |

### 25. Pobranie rund sesji
| | |
|---|---|
| **Hook** | `useSessionRoundsQuery(sessionId)` |
| **HTTP** | `GET /api/karaoke/sessions/{sessionId}/rounds` |
| **Query key** | `["karaoke", "session", sessionId, "rounds"]` |
| **Kiedy** | Na mount RoundsSection (gdy sessionId jest ustawione) |
| **Po co** | Lista rund w sesji |

### 26. Zmiana kolejności rund
| | |
|---|---|
| **Hook** | `useReorderSessionRoundsMutation()` |
| **HTTP** | `PUT /api/karaoke/sessions/{sessionId}/rounds/reorder` |
| **Kiedy** | Drag & drop rund |

### 27. Pobranie graczy rundy
| | |
|---|---|
| **Hook** | `useRoundPlayersQuery(roundId)` |
| **HTTP** | `GET /api/karaoke/rounds/{roundId}/players` |
| **Query key** | `["karaoke", "round", roundId, "players"]` |
| **Kiedy** | Render RoundPlayersBadge / JoinRoundPanel |
| **Po co** | Lista graczy przypisanych do rundy |

### 28. Dołączenie gracza do rundy
| | |
|---|---|
| **Hook** | `useAddRoundPlayerMutation()` |
| **HTTP** | `POST /api/karaoke/rounds/{roundId}/players` |
| **Invalidacja** | `["karaoke", "round", roundId, "players"]`, `["karaoke", "session", sessionId, "rounds"]` |
| **Kiedy** | Klik "Join" w RoundsSection / JoinRoundPopup |

### 29. Dołączenie do imprezy (join party)
| | |
|---|---|
| **Hook** | `useJoinPartyMutation()` |
| **HTTP** | `POST /api/karaoke/events/{partyId}/join` |
| **Kiedy** | Przed dołączeniem do rundy (JoinRoundPanel / JoinRoundPopup) |
| **Po co** | Weryfikacja dostępu / dołączenie do eventu |

### 30. Anulowanie imprezy
| | |
|---|---|
| **Funkcja** | `cancelEvent(party.id, reason)` — imperatywne |
| **Plik** | `PartySettings.tsx` |
| **HTTP** | `POST /api/events/{id}/cancel` |
| **Invalidacja** | Ręczna: `["karaoke", "parties"]` |
| **Kiedy** | Klik "Cancel party" |

---

## F. PartyPage → Uprawnienia (PermissionsPanel)

### 31. Pobranie uprawnień gracza
| | |
|---|---|
| **Hook** | `usePlayerPermissionsQuery(partyId, playerId)` |
| **HTTP** | `GET /api/permissions/events/{partyId}/players/{playerId}` |
| **Query key** | `["party", "permissions", partyId, playerId]` |
| **Kiedy** | Render wiersza gracza (automatyczne) |
| **Po co** | Bitmaska uprawnień gracza |

### 32. Nadanie uprawnienia
| | |
|---|---|
| **HTTP** | `POST /api/permissions/events/{partyId}/players/{playerId}/grant?permission={perm}` |
| **Kiedy** | Toggle uprawnienia → ON |

### 33. Odebranie uprawnienia
| | |
|---|---|
| **HTTP** | `POST /api/permissions/events/{partyId}/players/{playerId}/revoke?permission={perm}` |
| **Kiedy** | Toggle uprawnienia → OFF |

### 34. Masowe nadanie uprawnień
| | |
|---|---|
| **HTTP** | `POST /api/permissions/events/{partyId}/players/permissions/bulk` |
| **Kiedy** | Klik "Bulk Grant" |

### 35. Masowe odebranie uprawnień
| | |
|---|---|
| **HTTP** | `POST /api/permissions/events/{partyId}/players/permissions/bulk-revoke` |
| **Kiedy** | Klik "Bulk Revoke" |

### 36. Historia uprawnień
| | |
|---|---|
| **Hook** | `usePermissionHistoryQuery(partyId, query)` |
| **HTTP** | `GET /api/permissions/readable/events/{partyId}/history/expanded` |
| **Query key** | `["party", "permissions", partyId, "history", query]` |
| **Kiedy** | Na mount + paginacja |
| **Po co** | Audit trail uprawnień |

---

## G. KaraokeRoundPage (sesja karaoke)

### 37. Pobranie pełnej piosenki
| | |
|---|---|
| **Hook** | `useSongQuery(songId)` |
| **HTTP** | `GET /api/karaoke/get-song/{id}` |
| **Query key** | `["karaoke", "song", id]` |
| **Kiedy** | Gdy piosenka to "minimal stub" (brak notes) |
| **Po co** | Pobranie pełnych danych piosenki (nuty, videoPath, audioPath) |

### 38. Guard uczestnika (na KaraokeRoundPage)
| | |
|---|---|
| **Hook** | `usePartyStatusQuery(partyId)` |
| **HTTP** | `GET /api/karaoke/get-event/{id}` |
| **Kiedy** | Gdy `partyId` jest ustawione |
| **Po co** | Sprawdzenie czy user jest uczestnikiem — jeśli nie → redirect do `/parties/{id}` |

### 39. Zapisanie rundy (start gry)
| | |
|---|---|
| **Funkcja** | `postAddRound(roundData)` — imperatywne |
| **HTTP** | `POST /api/karaoke/add-round` |
| **Kiedy** | Start odtwarzania piosenki |
| **Po co** | Utworzenie rekordu rundy w bazie |

### 40. Zapisanie wyników
| | |
|---|---|
| **Funkcja** | `postSaveResults(results)` — imperatywne |
| **HTTP** | `POST /api/karaoke/save-results` |
| **Kiedy** | Koniec odtwarzania piosenki |
| **Po co** | Zapisanie wyników śpiewania |

### 41. Pobranie najlepszych wyników
| | |
|---|---|
| **Funkcja** | `fetchTopSingings(songId)` — imperatywne |
| **HTTP** | `GET /api/karaoke/songs/{songId}/top-singings` |
| **Kiedy** | Po zapisaniu wyników (callback sukcesu) |
| **Po co** | Leaderboard podsumowania |

### 42. Wyszukiwanie YouTube
| | |
|---|---|
| **Funkcja** | `searchYouTubeByArtistTitle(artist, title)` — imperatywne |
| **HTTP** | `GET /api/karaoke/songs/youtube/search?query={artist+title}` |
| **Kiedy** | Gdy piosenka nie ma video ani YouTube ID |
| **Po co** | Wyszukanie backing video na YouTube |

### 43. Transkrypcja audio (ASR)
| | |
|---|---|
| **Funkcja** | `postTranscribe(file, opts)` — imperatywne |
| **HTTP** | `POST /api/ai/audio/asr` (multipart) |
| **Kiedy** | Upload pliku audio do transkrypcji |
| **Po co** | Rozpoznawanie mowy (Speech-to-Text) |

---

## ⚠ Kluczowe obserwacje (problemy)

### Problem: Skąd lista uczestników?

Uczestnicy wyświetlani w `ParticipantsPanel` pochodzą **wyłącznie** z:

```
GET /api/karaoke/get-event/{id}  →  response.status.players[]
```

**Nie ma dedykowanego endpointu `GET /api/events/{id}/participants`!**

Łańcuch danych:
1. `usePartyStatusQuery(id)` woła `fetchPartyStatus(id)` → `GET /api/karaoke/get-event/{id}`
2. `fetchPartyStatus` wyciąga `.status` z odpowiedzi
3. `usePartyPage` w `useMemo` parsuje `status.players[]` → tablica `KaraokePlayer[]`
4. Jeśli `status.players` jest pusty/brak go → **lista uczestników jest pusta na froncie**

**Jeśli backend nie zwraca `players` w odpowiedzi `get-event/{id}` → frontend nie wyświetli uczestników.**

### Problem: Podwójne zapytanie o ten sam endpoint

Endpointy **#6** i **#7** wołają **ten sam URL** (`GET /api/karaoke/get-event/{id}`), ale mają **różne query keys**. To znaczy, że:
- Są cachowane osobno
- Mogą dawać niezsynchronizowane dane
- Dwa identyczne requesty lecą prawie równocześnie na mount

### Problem: JoinPartyMutation vs AddParticipantMutation

Są **dwie różne mutacje** do "dołączenia":
- `useAddParticipantMutation()` → `POST /api/events/{id}/participants` (z apiEvents)
- `useJoinPartyMutation()` → `POST /api/karaoke/events/{partyId}/join` (z JoinRoundPanel)

Prawdopodobnie robią różne rzeczy na backendzie, ale mogą prowadzić do zamieszania.
