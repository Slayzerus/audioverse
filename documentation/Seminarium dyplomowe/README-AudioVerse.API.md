# AudioVerse — Karaoke subsystem (kompendium)

Ten dokument opisuje wyłącznie funkcjonalność modułu karaoke w projekcie AudioVerse. Ma służyć jako kompleksowy przewodnik dla deweloperów frontend, integratorów oraz osoby piszącej pracę dyplomową.

> Uwaga: pominięto opisy dotyczące DMX i edytora audio — dokument skupia się na katalogu piosenek, imprezach karaoke, współpracy i wersjonowaniu.

## O aplikacji (krótka opowieść)

AudioVerse to backend dla aplikacji karaoke — serwisu, który umożliwia przechowywanie, odtwarzanie i współtworzenie piosenek karaoke. Aplikacja jest zaprojektowana tak, aby obsłużyć zarówno prostego użytkownika, który chce odtworzyć piosenkę na imprezie, jak i zespoły redakcyjne tworzące i poprawiające pliki z napisami i timings.

W praktyce backend dostarcza API do: importu i parsowania plików Ultrastar, zarządzania biblioteką piosenek, tworzenia i prowadzenia sesji karaoke (party), zapraszania współtwórców, wersjonowania zmian (pełne snapshoty piosenek wraz z notatkami) oraz przywracania dowolnej wersji. Dzięki temu frontend (web / mobile) może zaoferować edytor piosenek, listy odtwarzania, system zaproszeń i mechanizmy moderatorów bez konieczności reimplementowania logiki serwera.

W dalszej części README znajdziesz szczegóły techniczne, modele domenowe, listę endpointów oraz wskazówki dla integratorów i do pracy dyplomowej.

---

## 1. Cel modułu
- Przechowywanie i indeksowanie piosenek karaoke (Ultrastar i powiązane formaty).
- Importowanie i parsowanie plików piosenek z notacjami (lines / `Notes`).
- Zarządzanie imprezami karaoke (party) oraz uczestnikami.
- Współpraca przy tworzeniu i edycji piosenek (kolaboranci z rolami/poziomami uprawnień).
- Pełne wersjonowanie piosenek (snapshot JSON) i możliwość przywrócenia dowolnej wersji.

## 2. Najważniejsze modele domenowe
- `KaraokeSongFile` — encja piosenki: `Title`, `Artist`, `Genre`, `Year`, `FilePath`, `AudioPath`, `VideoPath`, lista `Notes`, flagi `IsVerified`, `InDevelopment`.
- `OwnerId` (nullable) — opcjonalny właściciel utworu; `CanBeModifiedByAll` (nullable) — jeśli `true`, każdy może modyfikować.
- `KaraokeSongCollaborator` — powiązanie `SongId` ↔ `UserId` z polem `Permission` (enum `CollaborationPermission`: `Read`, `Write`, `Manage`).
- `KaraokeSongFileHistory` — snapshot: `DataJson` (pełna serializacja piosenki), `Version` (int), `ChangedByUserId`, `Reason`, `ChangedAt`.

## 3. Architektura i komponenty
- CQRS (MediatR): handlery rozdzielają zapytania i komendy.
- Repository pattern: `IKaraokeRepository` z implementacjami EF Core i Dapper.
- `ICurrentUserService` dostarcza `UserId` i `IsAdmin` do handlerów.
- `ExceptionHandlingMiddleware` mapuje wyjątki aplikacyjne na spójne odpowiedzi HTTP.

## 4. Zasady dostępu (ACL)
- Role:
  - `Admin` — pełen dostęp do wszystkiego.
  - `Owner` — właściciel piosenki (pole `OwnerId`).
  - `Collaborator` — lista użytkowników z przypisanymi `Permission`.
- Widoczność piosenki dla użytkownika zależy od: publiczności (`OwnerId == null`), pola `CanBeModifiedByAll`, bycia ownerem lub bycia kolaborantem.
- Uprawnienia kolaborantów:
  - `Read` — tylko odczyt,
  - `Write` — edycja treści piosenki (notes/metadane),
  - `Manage` — dodatkowo zmiana statusów (`InDevelopment`, `IsVerified`) oraz dostęp do historii i revertów.

> Ważne: wszystkie sprawdzenia ACL wykonują się w handlerach CQRS (logika nie opiera się na kontroli w kontrolerach).

## 5. API — skrócony przegląd endpointów (prefiks: `/api/karaoke`)

### Wyszukiwanie użytkowników (do dodania kolaborantów)
- `GET /api/karaoke/users/search?term={term}`
  - wymagane min. 3 znaki
  - response: `[{ Id, UserName, Email }, ...]`

### Zarządzanie kolaborantami
- `GET /api/karaoke/songs/{songId}/collaborators` — zwraca listę `userId`.
- `POST /api/karaoke/songs/{songId}/collaborators` — body JSON `{ "userId": 42, "permission": "Manage" }` (dodanie z uprawnieniem).
- `PUT /api/karaoke/songs/{songId}/collaborators/{userId}` — body: enum (np. `"Write"` lub liczba) — aktualizacja permission.
- `DELETE /api/karaoke/songs/{songId}/collaborators/{userId}` — usuń kolaboranta.

### Historia / wersjonowanie
- `GET /api/karaoke/songs/{songId}/versions` — lista wersji: `[{ Version, ChangedAt, ChangedByUserId, Reason }, ...]`.
- `GET /api/karaoke/songs/{songId}/versions/{version}` — pobierz snapshot JSON (`DataJson`).
- `POST /api/karaoke/songs/{songId}/versions/{version}/revert` — body: optional reason string; przywraca wersję i zapisuje nowy snapshot.

> Szczegółowe przykłady request/response znajdują się w pliku `AudioVerse.API/TODO.txt` (sekcja "Request / Response — przykłady").

## 6. CQRS — najważniejsze komendy / zapytania
- `GetAllSongsQuery(includeInDevelopment)` — handler sprawdza `ICurrentUserService` i filtruje przez `GetAvailableSongsForUserAsync`.
- `GetSongByIdQuery(id)`, `GetSongHistoryQuery(songId)`, `GetSongVersionQuery(songId, version)`.
- `AddCollaboratorCommand(songId, userId, permission)`, `RemoveCollaboratorCommand`, `UpdateCollaboratorPermissionCommand`.
- `RevertSongVersionCommand(songId, version, changedByUserId, reason)`.

## 7. Wersjonowanie — workflow i uwagi implementacyjne
1. Dodanie piosenki → tworzenie snapshotu (`Version = 1`, `DataJson` = serializacja `KaraokeSongFile`).
2. Kolejne zmiany → tworzone kolejne snapshoty z inkrementowaną wersją.
3. Revert → deserializacja `DataJson` → nadpisanie encji (`Notes` zostają zastąpione) → zapis nowego snapshotu dokumentującego revert.

### Uwaga techniczna
- Snapshoty zapisane jako JSON mogą być duże; rozważ strategię retencji/archiwizacji lub kompresji w produkcji.

## 8. Lokalizacja kodu (gdzie szukać implementacji)
- Kontroler: `AudioVerse.API/Controllers/KaraokeController.cs`.
- Handlery CQRS: `AudioVerse.Application/Handlers/Karaoke/`.
- Repozytoria: `AudioVerse.Infrastructure/Repositories/KaraokeRepositoryEF.cs` (EF Core) i `KaraokeRepository.cs` (Dapper).
- Modele domenowe: `AudioVerse.Domain/Entities/Karaoke/`.

## 9. Wyjątki i spójne kody błędów
- Handlery rzucają wyjątki aplikacyjne (`AudioVerse.Application.Exceptions.ApiException` i pochodne: `NotAuthorizedException`, `NotFoundException`, `BadRequestException`).
- `ExceptionHandlingMiddleware` mapuje wyjątki na JSONowe odpowiedzi z odpowiednim kodem HTTP.

## 10. Wskazówki dla frontendu / integratora
- Dodawanie kolaboranta: wyszukaj użytkownika (`/users/search`), wyślij `POST /songs/{id}/collaborators` z obiektem `{ userId, permission }`.
- Pobranie historii: `GET /songs/{id}/versions`, potem `GET /songs/{id}/versions/{ver}` dla podglądu snapshotu.
- Revert: dostępne tylko dla ownera, admina lub kolaboranta z permission `Manage`.
- Pamiętaj: server zwraca 403/404/400 z ustandaryzowanym JSON-em (middleware).

## 11. Pomysły i kierunki rozwoju (praca dyplomowa)
- Porównanie podejść do wersjonowania: snapshot JSON vs event sourcing vs DB triggers — koszty, zalety, scenariusze użycia.
- Badanie wpływu snapshotów JSON na wydajność i projektowanie polityk retencji (archiwizacja, kompresja, przenoszenie do object storage).
- Projekt UX dla workflow zaproszeń: invite → accept vs natychmiastowe nadawanie uprawnień.
- Scenariusze testowe: ACL (owner/collaborator/admin/outsider), wydajność zapisu snapshotów, masowy import piosenek.

---

Jeśli chcesz, mogę:
- wygenerować plik migracji EF Core (dodanie tabel history/collaborators i kolumn),
- wygenerować przykładowe polecenia `curl` dla każdego endpointu karaoke,
- przygotować rozdział z przykładami frontend (sekwencje REST + przykłady JSON).

## 12. Konteneryzacja i wdrożenie
- Projekt jest przygotowany jako backend AudioVerse i łatwo pakuje się do kontenera Docker. Typowe pliki do obsługi konteneryzacji to `Dockerfile` i (opcjonalnie) `docker-compose.yml` w katalogu aplikacji API — jeżeli ich nie ma, można je szybko dodać na podstawie standardowego szablonu .NET 10:
  - Build obrazu: `docker build -t audioverse-api:latest ./src/AudioVerse.API`
  - Uruchomienie kontenera: `docker run -e ASPNETCORE_ENVIRONMENT=Production -p 5000:80 audioverse-api:latest`
- W środowisku produkcyjnym warto uruchamiać kontenery za pomocą orkiestratora (Kubernetes) lub platformy PaaS, dodać health checks, konfigurację sekretów oraz politykę logowania (np. do centralnego serwisu logów).

## 13. Uwaga o `ResourceLibrary.API`
- W repo istnieje również projekt `ResourceLibrary.API` (biblioteka współdzielona). Zawiera komponenty i helpery ogólne — np. wspólne DTO, helpery do serializacji, obsługę storage/plików, moduły autoryzacji lub wspólne service-y. Te komponenty są zaprojektowane tak, aby można je było wykorzystać w innych typach projektów (np. aplikacje audio, media library, inne mikroserwisy).
- Przy tworzeniu nowych funkcji rozważ umieszczanie kodu generics / utility w `ResourceLibrary.API` zamiast bezpośrednio w `AudioVerse.API` — poprawia to reużywalność i testowalność.
