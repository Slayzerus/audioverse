# AudioVerse Documentation

> **AudioVerse** — kompleksowa platforma do organizacji wydarze? karaoke, zarz?dzania bibliotek? muzyczn? i edycji audio.

---

## ?? Spis tre?ci

### Funkcjonalno?ci
- [?? Karaoke](features/karaoke.md) — imprezy, rundy, punktacja, kolejki piosenek
- [?? Wydarzenia](features/events.md) — harmonogram, menu, atrakcje, ankiety, rozliczenia
- [?? Biblioteka Muzyczna](features/media-library.md) — utwory, arty?ci, albumy, pobieranie
- [??? Edytor Audio](features/editor.md) — projekty, sekcje, warstwy, efekty
- [?? Gry](features/games.md) — planszówki (BGG), gry kooperacyjne (Steam)
- [?? DMX](features/dmx.md) — sterowanie o?wietleniem, sceny

### Administracja
- [?? Zarz?dzanie u?ytkownikami](admin/users.md)
- [?? Bezpiecze?stwo](admin/security.md)
- [?? Konfiguracja systemu](admin/configuration.md)

### API
- [?? Endpointy REST](api/endpoints.md)
- [?? SignalR Hubs](api/signalr.md)
- [?? Autoryzacja](api/authorization.md)

### Architektura
- [??? Przegl?d](architecture/overview.md)
- [?? Struktura projektu](architecture/structure.md)
- [??? Baza danych](architecture/database.md)

---

## ?? Szybki start

### Wymagania
- .NET 10 SDK
- PostgreSQL 15+
- MinIO (opcjonalnie, dla plików)
- Redis (opcjonalnie, dla cache/lobby)

### Uruchomienie lokalne

```bash
# Klonowanie repozytorium
git clone https://dev.azure.com/audioverse/AudioVerse/_git/AudioVerse

# Przej?cie do katalogu
cd AudioVerse/audioverse-dotnet

# Przywrócenie pakietów
dotnet restore

# Uruchomienie migracji
dotnet ef database update --project AudioVerse.API

# Uruchomienie aplikacji
dotnet run --project AudioVerse.API
```

### Domy?lne konto administratora
- **Email:** `admin@audioverse.local`
- **Has?o:** `Admin123!`

---

## ?? G?ówne modu?y

| Modu? | Opis | Status |
|-------|------|--------|
| **Karaoke** | Organizacja imprez karaoke z rundami i punktacj? | ? Produkcja |
| **Events** | Zarz?dzanie wydarzeniami, harmonogramem, menu | ? Produkcja |
| **MediaLibrary** | Biblioteka muzyczna z integracj? Spotify/Tidal | ? Produkcja |
| **Editor** | Edytor audio z warstwami i efektami | ?? Beta |
| **Games** | Integracja z BGG i Steam dla gier | ? Produkcja |
| **DMX** | Sterowanie o?wietleniem ArtNet | ?? Beta |

---

## ?? Linki

- [Azure DevOps](https://dev.azure.com/audioverse/AudioVerse)
- [Swagger UI](http://localhost:5000/swagger) (lokalne uruchomienie)
- [CONTRIBUTING.md](../CONTRIBUTING.md)

---

*Dokumentacja wygenerowana: Luty 2026*
