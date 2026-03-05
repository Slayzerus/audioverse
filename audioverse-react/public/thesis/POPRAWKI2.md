# POPRAWKI2 — Wyniki przeglądu całej pracy dyplomowej

*Przegląd wykonany: 2026-03-04 po zakończeniu reorganizacji 5-rozdziałowej (Uwaga 7).*

---

## ✅ STATUS REALIZACJI (2026-03-04)

| ID  | Status |
|-----|--------|
| B1  | ✅ Zrealizowane — ref. do rys. 3.2, przeniesiony do rozdz. 3 |
| B2  | ✅ Zrealizowane — `audio-separate` usunięty; docker compose ma teraz 10 serwisów (5×AI) |
| B3  | ✅ Zrealizowane — `niskolatencyjna` |
| B4  | ✅ Zrealizowane — `niewytrenowanych` |
| B5  | ✅ Zrealizowane — `ciągła funkcja` |
| B6  | ✅ Zrealizowane — `przedstawiono` (łącznie z B1) |
| L1  | ✅ Zrealizowane — dodano cytat [7] w sekcji 2.3 |
| S1  | ✅ Zrealizowane — rys. 3.2 przeniesiony do sekcji 3.2 |
| S2  | ⏳ Wymaga danych od autora — sekcja 5.5 może mieć dane testowe (stub); autor proszony o potwierdzenie lub dostarczenie realnych wyników |
| S3  | ⏳ Wymaga doprecyzowania — ile razy przetwarzano każdy plik dla Tab. 5.1? |
| S4  | ✅ Zrealizowane — sekcja 4.3.5 zaktualizowana: CREPE opisany jako live z opóźnieniem na CPU, spełniający WNF01 na GPU |
| S5  | do rozważenia przez autora |

**Dodatkowo zrealizowane (Bonus z sesji):**
- ✅ Usunięto Demucs/separację: sekcja 2.10 usunięta, sekcja 2.4 skrócona, `audio_separate` usunięty z docker-compose, tabeli latencji i tabeli stos technologiczny. Sekcje 2.11–2.15 przemianowane na 2.10–2.14.
- ✅ Zaktualizowano opis CREPE w sekcjach 4.3.5 i 5.4: testy CPU-only ze względu na przenośność wdrożenia; GPU pozwala spełnić WNF01.

---

---

## BŁĘDY — wymagają obowiązkowej poprawki

### B1. Stałe odesłanie do usuniętej figury (2.txt, sekcja 2.14)

**Plik:** 2.txt, linia ~558  
**Problem:** Sekcja 2.14 zawiera:  
> „Schemat komunikacji między warstwami **przedstawiano** na **rysunku 3.3** (szczegółowy opis implementacji komunikacji zamieszczono w rozdziale 4)."

Po reorganizacji rozdziałów schemat komunikacji (dawny rys. 3.3) jest teraz **Rysunek 2.8** w tym samym rozdziale 2. Odwołanie do „rysunku 3.3" jest martwe — nie istnieje żaden Rysunek 3.3.

**Poprawka:**
```
Schemat komunikacji między warstwami przedstawiono na rysunku 2.8
(szczegółowy opis implementacji komunikacji zamieszczono w rozdziale 4).
```

---

### B2. Błędna liczba serwisów Docker Compose (4.txt, sekcja 4.6)

**Plik:** 4.txt, linia ~384 i ~418  
**Problem:** Tekst mówi: *„Plik `docker-compose.yaml` definiuje **10 serwisów**"*, a opis rysunku 4.13 to powtarza. Tymczasem lista YAML zawiera **11 wpisów**:  
`audioverse-api`, `audioverse-identity`, `audio-pitch`, `sing-score`, `audio-separate`, `audio-rhythm`, `audio-vad`, `audio-analysis`, `postgresql`, `minio`, `redis`.  
Wyliczenie w podpisie (API + Identity + 6×AI + PostgreSQL + MinIO + Redis) samo daje 11.

**Poprawka:** zamienić „10 serwisów" → „**11 serwisów**" w dwóch miejscach (tekst i podpis rys. 4.13).

---

### B3. Literówka — nieistniejące słowo „niskolażencyjna" (2.txt, sekcja 2.15)

**Plik:** 2.txt, linia ~593  
**Problem:** „wymagana jest dwukierunkowa, **niskolażencyjna** komunikacja"  
**Poprawka:** „**niskolatencyjna**"

---

### B4. Literówka — nieistniejące słowo „niestransowania" (5.txt, sekcja 5.7)

**Plik:** 5.txt, linia ~193  
**Problem:** „w celu poprawy RPA dla śpiewaków **niestransowania**"  
Słowo nie istnieje w języku polskim. Prawdopodobne znaczenie: „śpiewaków **niewytrenowanych**" (nieprofesjonalnych, amatorów).  
**Poprawka:** „w celu poprawy RPA dla **śpiewaków niewytrenowanych**"

---

### B5. Błąd gramatyczny — niezgodność przypadka (2.txt, sekcja 2.7)

**Plik:** 2.txt, linia ~254  
**Problem:** „Sygnał dźwiękowy to **ciągłą** funkcja ciśnienia..."  
„ciągłą" to accusativus, a po „to" (łącznik nominalny) powinna stać forma mianownikowa.  
**Poprawka:** „Sygnał dźwiękowy to **ciągła** funkcja ciśnienia..."

---

### B6. Błąd stylistyczny — forma imperfektywna (2.txt, sekcja 2.14)

**Plik:** 2.txt, linia ~558 (ten sam wiersz co B1)  
**Problem:** „przedstawiano" (czas przeszły niedokonany — imperfektywum sugeruje czynność powtarzaną w przeszłości).  
**Poprawka:** „**przedstawiono**" (perfectivum jednorazowe — standardowe w opisach akademickich).

*(Poprawka łączy się z B1: cały wiersz powinien brzmieć: „Schemat komunikacji między warstwami przedstawiono na rysunku 2.8...")*

---

## LITERATURA — wymaga decyzji autora

### L1. Pozycja [7] w bibliografii nigdzie nie cytowana

**Plik:** 5.txt, lista literatury  
**Problem:** Pozycja `[7] J. Salamon, E. Gómez, „Melody Extraction from Polyphonic Music Signals...", IEEE Trans. ASLP, 2012` figuruje w bibliografii, ale **nie pojawia się żaden odsyłacz `[7]` w całym tekście**.

**Opcje do wyboru:**
- **Opcja A** — dodać cytowanie `[7]` w sekcji 2.3 (omówienie metod detekcji melodii), np. przy zdaniu o metodach autokorelacyjnych lub na końcu wprowadzenia do sekcji.
- **Opcja B** — usunąć pozycję [7] z bibliografii i przeliczyć numery [8]...[14] na [7]...[13].

---

## SUGESTIE — do rozważenia przez autora

### S1. Diagram architektury w rozdziale o architekturze

**Plik:** 3.txt, sekcja 3.2  
**Obserwacja:** Rozdział 3 nosi tytuł "Projekt i architektura systemu", ale sekcja 3.2 nie zawiera żadnego własnego rysunku — odsyła czytelnika do `rys. 2.8` z rozdziału 2. Opis architektury (sekcja 3.2) to jeden akapit.

**Sugestia:** Warto rozważyć przeniesienie lub zduplikowanie rys. 2.8 (schemat komunikacji między warstwami) do sekcji 3.2, żeby rozdział poświęcony architekturze był samowystarczalny. Alternatywnie rozbudować sekcję 3.2 o opis warstw (Frontend → Backend → AI → Dane).

---

### S2. Mała próba w teście subiektywnym (5.txt, sekcja 5.5)

**Plik:** 5.txt, sekcja 5.5  
**Obserwacja:** Ocena jakości systemu oceniania oparta jest na **5 użytkownikach testowych** (3 próby każdy = 15 pomiarów łącznie). To bardzo mała próba.

**Sugestia:** Dodać krótki opis demograficzny uczestników (np. „5 osób w wieku 20–28 lat, bez formalnego wykształcenia muzycznego") i zaznaczyć ograniczenie małej próby w sekcji 5.7 (Ograniczenia).

---

### S3. Liczba powtórzeń w eksperymencie porównawczym F0 (5.txt, sekcja 5.3)

**Plik:** 5.txt, sekcja 5.3  
**Obserwacja:** Sekcja 5.1 deklaruje N=10 powtórzeń dla benchmarku latencji, ale dla eksperymentu porównawczego pYIN/CREPE (Tabela 5.1) nie podano liczby powtórzeń. Nie wiadomo, czy wartości RMSE to wynik jednorazowego uruchomienia czy średnia.

**Sugestia:** Dopisać w sekcji 5.3 jedno zdanie, np.: „Każdy plik przetworzone jednokrotnie / każdy plik przetworzono N=X razy i uśredniono wyniki."

---

### S4. Opis opcji wyboru algorytmu na stronie ustawień (4.txt, sekcja 4.3.5)

**Plik:** 4.txt, sekcja 4.3.5  
**Obserwacja:** Opis strony `/settings/audio-input` wymienia możliwość wyboru algorytmu „pYIN dla trybu gry lub CREPE dla analizy post-hoc". Może to sugerować, że CREPE działa w pętli real-time WebSocket, co jest sprzeczne z wynnikami benchmarku (latencja 310 ms, wymóg WNF01 niespełniony).

**Sugestia:** Dodać krótkie wyjaśnienie, że wybór CREPE na stronie ustawień aktywuje analizę **po zakończeniu rundy** (post-hoc), a nie zastępuje pYIN podczas bieżącej rozgrywki WebSocket.

---

### S5. Brak narracyjnego opisu relacji modelu danych (3.txt, sekcja 3.3)

**Plik:** 3.txt, sekcja 3.3  
**Obserwacja:** Sekcja zawiera tabelę encji i diagram ER, ale brakuje zdań opisujących relacje między encjami (np. „Każda `KaraokeSession` ma wiele `KaraokeSessionRound`; każda runda powiązana jest z graczami przez `KaraokeSessionRoundPlayer`..."). Tabela podaje pola, ale nie tłumaczy topologii modelu.

**Sugestia:** Dopisać 3–5 zdań prozą opisujących kluczowe związki encji (1:N, N:M), aby czytelnik zrozumiał model bez samodzielnego odczytywania diagramu.

---

## Podsumowanie

| ID  | Plik   | Typ       | Priorytet  | Status   |
|-----|--------|-----------|------------|----------|
| B1  | 2.txt  | Błąd ref. | **Krytyczny** | Do poprawy |
| B2  | 4.txt  | Błąd liczby | **Wysoki** | Do poprawy |
| B3  | 2.txt  | Literówka | **Wysoki** | Do poprawy |
| B4  | 5.txt  | Literówka | **Wysoki** | Do poprawy |
| B5  | 2.txt  | Gramatyka | Średni     | Do poprawy |
| B6  | 2.txt  | Styl      | Niski      | Do poprawy |
| L1  | 5.txt  | Literatura | **Wysoki** | Decyzja autora |
| S1  | 3.txt  | Treść     | Średni     | Do rozważenia |
| S2  | 5.txt  | Metodologia | Niski    | Do rozważenia |
| S3  | 5.txt  | Metodologia | Niski    | Do rozważenia |
| S4  | 4.txt  | Klarowność | Niski     | Do rozważenia |
| S5  | 3.txt  | Treść     | Niski      | Do rozważenia |
