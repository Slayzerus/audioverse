# MinIO / S3 i plakaty (poster)

Podsumowanie zmian dotyczących przechowywania plików (MinIO / S3) oraz obsługi plakatów dla eventów.

## Storage (S3 / MinIO)
- `S3FileStorage` (implementacja `IFileStorage`) obsługuje:
  - analiza bucket policy JSON (`GetBucketPolicy`) i fallback do ACL (AllUsers READ / FULL_CONTROL);
  - metody: `SetBucketPublicAsync`, `SetBucketPrivateAsync`, `IsBucketPublicAsync`, `ListBucketsAsync`;
  - upload z retry (eksponencjalny backoff) i timeout na każdą próbę;
  - mapowanie kodów S3 na wyjątki/statusy HTTP;
  - generowanie prostego publicznego policy JSON przy ustawianiu bucketu publicznym.

## Endpointy administracyjne
- `GET  /api/karaoke/admin/buckets` — lista bucketów z flagą `IsPublic` (wymaga roli `Admin`).
- `GET  /api/karaoke/admin/buckets/{bucket}/public` — sprawdza publiczność bucketu (Admin).
- `POST /api/karaoke/admin/buckets/{bucket}/public?makePublic=true|false` — przełącza public/private (Admin).

## Obsługa plakatów (poster)
- Endpointy przyjmują `multipart/form-data`:
  - `POST /api/events` — tworzenie eventu (można dołączyć plik `poster` jako `IFormFile`).
  - `PUT  /api/events/{id}` — aktualizacja eventu (opcjonalny `poster`).
- Pobieranie plakatu:
  - `GET  /api/karaoke/events/{id}/poster-url` — presigned URL (z parametrem `validSeconds`).
  - `GET  /api/karaoke/events/{id}/poster-public-url` — publiczny URL (jeśli bucket publiczny).
  - `DELETE /api/karaoke/event/{id}/poster` — usunięcie plakatu.

## Walidacja plakatu
- Walidator `ImageValidator` wykonuje:
  - sprawdzenie rozmiaru (`StorageOptions:Poster:MaxSizeBytes`);
  - sprawdzenie dozwolonych Content-Type (`StorageOptions:Poster:AllowedContentTypes`);
  - sniffing MIME przez `SixLabors.ImageSharp` z fallbackem na magic-bytes (PNG, JPEG, WebP, GIF, BMP, TIFF);
  - sprawdzenie zgodności Content-Type i rozszerzenia z wykrytym formatem;
  - błędy walidacji zwracają odpowiednie kody (np. 413, 415/400).

## Upload i przechowywanie
- Plakat uploadowany jest do bucketa **`event-posters`** pod kluczem `posters/{guid}{ext}`.
- W encji `Event.Poster` zapisywany jest klucz obiektu (nie pełny URL); pobieranie przez presigned URL lub publiczny URL.
- Błędy uploadu są mapowane na przyjazne odpowiedzi w `KaraokeController.MapUploadExceptionToResult` (504, 503, 502, 404, 500).

## Seedowanie pierwszego eventu
- `IdentitySeeder` tworzy `First Event` — jeśli w katalogu `Seed/poster.jpg` znajduje się plik, seed spróbuje go uploadować do bucketu `event-posters` i ustawić `event.Poster` na wygenerowany klucz.
- Sprawdzane lokalizacje: `AppContext.BaseDirectory/Seed/poster.jpg` oraz `Directory.GetCurrentDirectory()/Seed/poster.jpg`.
- Upload seedowy jest nieblokujący — błędy są logowane, seed kontynuuje.

## Metryki i diagnostyka
- Prosty licznik nieudanych uploadów `InMemoryUploadMetrics` (interfejs `IUploadMetrics`).
- Endpoint: `GET /api/karaoke/admin/metrics/upload-failures` — zwraca liczniki (Admin).

## Rate limiting
- Opcjonalny limiter Redis (`RedisRateLimiter`) z fallbackiem `InMemoryRateLimiter` gdy Redis nie jest skonfigurowany.
- Limiter stosowany przy uploadach plakatów (create/update). Domyślnie: 10 prób/min na użytkownika (konfigurowalne `RateLimiting:UploadsPerMinute`).

## Zmiana nazwy bucketu
⚠️ **BREAKING**: bucket zmieniony z `party-posters` na `event-posters`. Jeśli używacie istniejącej instancji MinIO, utwórzcie nowy bucket lub zmieńcie nazwę starego.

---

Plik aktualizowany po ostatnich zmianach Party → Event.
