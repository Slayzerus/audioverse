# Plan poprawek pracy dyplomowej — na podstawie uwag promotora

Poniżej każda uwaga promotora rozpisana na konkretne działania do wykonania
w plikach rozdziałów 1–5.

---

## Uwaga 1 — Strona tytułowa: „mgr i inż. — za jednym razem pan broni?"

**Problem:** Na stronie tytułowej widnieją oba tytuły (mgr i inż.),
co sugeruje, że praca uprawnia do obu stopni na raz.

**Do zrobienia:**
- Otworzyć plik `.docx` / stronę tytułową i usunąć stopień **mgr**.
- Zostawić wyłącznie: *praca inżynierska* / *inżynier (inż.)*.
- Upewnić się, że nagłówek brzmi np.
  „Praca dyplomowa inżynierska" (nie: „magisterska" ani „mgr inż.").

**Pliki:** strona tytułowa w `.docx`.

---

## Uwaga 2 — Spis treści: usunąć 3. poziom zagnieżdżenia

**Problem:** W spisie treści widoczne są podrozdziały na poziomie 3
(np. 2.5.1, 2.5.2, 3.3.1, 3.3.2, 4.4.1–4.9 itd.).
Promotor oczekuje co najwyżej 2 poziomów (rozdziały + podrozdziały).

**Do zrobienia:**
- W edytorze tekstu (Word/LaTeX) ustawić spis treści na **maksymalnie 2 poziomy** (Heading 1 i Heading 2).
- Podrozdziały 3. poziomu (np. `### 2.5.1. SingStar`) pozostają w treści —
  znikają tylko ze spisu.
- Sprawdzić każdy rozdział — lista pozycji do usunięcia ze spisu:
  - 2.5.1 – 2.5.7 (opisy aplikacji)
  - 3.3.1 – 3.3.4 (podrozdziały YIN/pYIN/CREPE)
  - 3.4.1 – 3.4.2 (Demucs i wpływ separacji)
  - 4.4.1 – 4.4.4 (podrozdziały backendu)
  - 4.6.1 – 4.6.5 (podrozdziały frontendu)
  - 4.7.1 – 4.7.4 (podrozdziały silnika karaoke)

**Pliki:** ustawienie ToC w `.docx` (styl/poziom) lub komenda `\setcounter{tocdepth}{2}` w LaTeX.

---

## Uwaga 3 — Rozdział 1.1 Wprowadzenie: opis bieżącego stanu, nie podsumowanie pracy

**Problem:** W sekcji 1.1 pojawia się zbyt dużo szczegółów implementacyjnych
(np. „dziewięć endpointów pomiarowych", „trasa /api/karaoke/lab", konkretne
liczby latencji, lista wszystkich technologii). To jest materiał na
rozdziały 4–5, a nie wstęp.

Wprowadzenie powinno zarysować **kontekst i motywację** (aktualny stan karaoke,
luka technologiczna), a **nie streszczać gotowej implementacji**.
Szczegółowe podsumowanie wyników należy do rozdziału 5.8.

**Do zrobienia w pliku 1.txt:**

1. Skrócić akapit opisujący AudioVerse w sekcji 1.1 — zamiast:
   > „moduł laboratoryjny (trasa /api/karaoke/lab), który udostępnia
   > dziewięć endpointów pomiarowych oraz generuje gotowe raporty PDF
   > z analizą statystyczną i wykresami"

   Napisać ogólnikowo:
   > „dedykowany moduł laboratoryjny umożliwiający przeprowadzenie
   > mierzalnych eksperymentów porównawczych algorytmów detekcji F0"

2. Usunąć z 1.1 zdania wymieniające konkretne wyniki liczbowe (latencje,
   RMSE itp.) — te informacje należą do rozdziału 5.

3. Usunąć z 1.1 fragment zaczynający się od „Cechą wyróżniającą AudioVerse…"
   do końca sekcji 1.1 (od słów „dziewięć endpointów pomiarowych…") —
   przenieść jego treść do sekcji 1.2 (Cel i zakres) lub do rozdziału 5.8
   jako fragment podsumowania.

4. Sekcję 1.1 zakończyć na zapowiedzi systemu, np.:
   > „Niniejsza praca opisuje system AudioVerse — webową grę karaoke
   > z oceną wykonania opartą na algorytmach uczenia maszynowego,
   > wypełniającą opisaną lukę technologiczną."

**Pliki:** `Gra wokalna karaoke z wykorzystaniem sztucznej inteligencji - 1.txt` (sekcja 1.1, ostatni akapit).

---

## Uwaga 4 — Opis systemu pojawia się już pod koniec rozdziału 3 (sekcje 3.8, 3.9)

**Problem:** Sekcja **3.8 Technologie implementacyjne** i **3.9 Komunikacja
w czasie rzeczywistym** opisują konkretne decyzje projektowe AudioVerse
(tabela stosu technologicznego, przepływ WebSocket, kod Pythona i TypeScript).
Są to treści właściwe dla rozdziału 4 (projekt i implementacja), nie dla
rozdziału 3 (metody i technologie).

Rozdział 3 powinien kończyć się opisem metod *ogólnych* (DTW, pYIN, CREPE,
Demucs, format UltraStar) bez przywiązania do konkretnej implementacji AudioVerse.

**Do zrobienia:**

- **Sekcja 3.8** — Tabelę 3.2 (Stos technologiczny AudioVerse) i jej omówienie
  **przenieść** do rozdziału 4 jako nową sekcję **4.1a / 4.10 Stos technologiczny**
  (lub wbudować do istniejącego 4.2 Architektura systemu).
  W rozdziale 3 pozostawić jedynie krótki akapit uzasadniający wybór kategorii
  technologii (np. „Backend w .NET, mikroserwisy AI w Python, frontend w React"),
  bez szczegółowej tabeli.

- **Sekcja 3.9** — Treść o SignalR, WebSocket, buforowaniu PCM i kodzie Pythona
  **przenieść** do rozdziału 4 jako sekcję **4.x Komunikacja w czasie rzeczywistym**
  (np. rozszerzyć istniejące 4.4.3 KaraokeHub / 4.5.1 audio_pitch).
  W rozdziale 3 można zostawić jedynie ogólne zdanie o wyborze transportu
  (WebSocket dla niskiej latencji).

- Po przeniesieniu rozdział 3 kończy się na sekcji **3.7 Format UltraStar TXT**
  lub dodać krótkie podsumowanie rozdziału.

**Pliki:** `- 3.txt` (usunąć/skrócić 3.8 i 3.9) oraz `- 4.txt` (dodać przeniesione treści).

---

## Uwaga 5 — Każdy rysunek i tabela muszą mieć odnośnik w tekście

**Problem:** Wiele rysunków i tabel nie jest przywoływanych bezpośrednio
w tekście. Promotor wymaga, aby każdy element miał co najmniej jedną
wzmiankę w formie np. „(rys. 4.2)", „(tab. 4.1)", „zob. rys. 3.3".

**Do zrobienia — przegląd wszystkich figur i tabel:**

### Rozdział 1
- Rys. 1.1 — dodać odnośnik w sekcji 1.1 przed/po opisie systemu:
  np. „…(rys. 1.1)".

### Rozdział 2
- Rys. 2.1 (SingStar) — dodać w tekście sekcji 2.5.1.
- Rys. 2.2 (UltraStar) — dodać w sekcji 2.5.2.
- Rys. 2.3 (Smule) — dodać w sekcji 2.5.3.
- Rys. 2.4 (KaraFun) — dodać w sekcji 2.5.6.
- Tab. 2.1 (Porównanie aplikacji) — dodać „(tab. 2.1)" w sekcji 2.6.
- Rys. 2.5 (Przeglądarka piosenek AudioVerse) — dodać w sekcji 2.6.

### Rozdział 3
- Rys. 3.1 (Spektrogram) — dodać w sekcji 3.1.
- Rys. 3.2 (Porównanie F0) — dodać w sekcji 3.3.4.
- Tab. 3.1 (Porównanie algorytmów F0) — dodać „(tab. 3.1)" w sekcji 3.3.4.
- Tab. 3.2 (Stos technologiczny) — dodać „(tab. 3.2)" w sekcji 3.8
  (uwaga: po przeniesieniu do rozdz. 4 zaktualizować numer).
- Rys. 3.3 (Schemat komunikacji) — dodać w sekcji 3.8 lub 4.2.

### Rozdział 4
- Tab. 4.1 (Wymagania funkcjonalne) — dodać „(tab. 4.1)" w sekcji 4.1.
- Tab. 4.2 (Encje domeny) — dodać „(tab. 4.2)" w sekcji 4.3.
- Rys. 4.1 (Diagram ER) — dodać w sekcji 4.3.
- Rys. 4.2 (CQRS) — dodać w sekcji 4.4.
- Rys. 4.3 (Przepływ sesji) — dodać w sekcji 4.4.1.
- Rys. 4.4 (JWT/OAuth flow) — dodać w sekcji 4.4.3.
- Tab. 4.3 (Endpointy lab) — dodać „(tab. 4.3)" w sekcji 4.4.4.
- Rys. 4.5 (Swagger) — dodać w sekcji 4.4.4.
- Rys. 4.6 (Pipeline lab) — dodać w sekcji 4.4.4.
- Rys. 4.7 (Routing React) — dodać w sekcji 4.6.
- Rys. 4.8 (Song browser) — dodać w sekcji 4.6.1.
- Rys. 4.9 (KaraokeRoundPage) — dodać w sekcji 4.6.2.
- Rys. 4.10 (Ranking) — dodać w sekcji 4.6.3.
- Rys. 4.11 (Tworzenie sesji) — dodać w sekcji 4.6.4.
- Rys. 4.12 (Ustawienia audio) — dodać w sekcji 4.6.5.
- Rys. 4.13 (LabPage) — dodać w sekcji 4.8.
- Rys. 4.14 (Docker Compose) — dodać w sekcji 4.9.

### Rozdział 5
- Rys. 5.1 (Testy) — dodać w sekcji 5.2.1 lub 5.2.2.
- Tab. 5.2 (pYIN vs CREPE) — dodać „(tab. 5.2)" w sekcji 5.3.
- Rys. 5.2 (Wykres RMSE) — dodać w sekcji 5.3.
- Rys. 5.3 (Trajektorie F0) — dodać w sekcji 5.3.
- Tab. 5.3 (Latencja) — dodać „(tab. 5.3)" w sekcji 5.4.
- Rys. 5.4 (Latencja wykres) — dodać w sekcji 5.4.
- Rys. 5.5 (Raport PDF) — dodać w sekcji 5.6.

**Sposób dodania odnośnika:** Przed lub po akapicie opisującym dany element
wstawić w nawiasie: `(rys. X.Y)` lub `(tab. X.Y)`, np.:

> Architektura CQRS w systemie AudioVerse (rys. 4.2) opiera się na bibliotece MediatR 12.

**Pliki:** wszystkie pliki rozdziałów (`- 1.txt` do `- 5.txt`).

---

## Uwaga 6 — Praca projektowa, nie badawcza; usunąć „ticki" z 5.8

### 6a. Charakter badawczy vs. projektowy

**Problem:** W sekcjach 1.1, 1.2, 1.3, 5.8 pojawia się sformułowanie
„pytanie badawcze" i retoryka charakterystyczna dla pracy naukowej/badawczej.
Promotor sugeruje ograniczyć się do stwierdzenia, że *wymagane funkcjonalności
zostały zrealizowane*.

**Do zrobienia:**

- W sekcji **1.2 Cel i zakres**: zmienić sformułowania pokroju
  „przeprowadzenie eksperymentów porównawczych" i „ocena jakości algorytmu"
  na sformułowania w stylu:
  „implementacja modułu pomiarowego umożliwiającego testowanie algorytmów"
  — usunąć sugestię stawiania hipotezy naukowej.

- W sekcji **1.3 Motywacja**: usunąć lub złagodzić fragment o „zidentyfikowanej
  luce technologicznej" jako sformułowanie quasi-badawcze; zamiast tego napisać
  o braku dostępnego rozwiązania, który był impulsem do realizacji projektu.

- W sekcji **5.8 Podsumowanie**: zastąpić sformułowanie
  „Odpowiedź na pytanie badawcze:" na np.
  „Wnioski dotyczące doboru algorytmu:" lub
  „Podsumowanie wyników eksperymentów:"

- W sekcji **5.3** i **5.4**: sformułowania wyników utrzymać, ale nie nazywać ich
  „weryfikacją hipotezy" — wystarczy „wyniki pomiarów wskazują, że…".

### 6b. Usunąć znaczniki ✓ z sekcji 5.8

**Problem:** Sekcja 5.8 zawiera listę z tikami `✓`:
```
1. ✓ Analiza literatury…
2. ✓ Opis i porównanie metod AI…
…
```

**Do zrobienia:**
- Usunąć wszystkie `✓` z listy w sekcji 5.8.
- Zastąpić listę tekstem ciągłym lub zwykłą listą bez znaczników, np.:
  > „Punkt 1 zakresu — analiza literatury — został zrealizowany w rozdziale 2.
  >  Punkt 2 — opis metod AI — w rozdziale 3." itd.
- Ewentualnie sformatować jako tabelę z kolumnami: Nr | Zakres | Rozdział.

**Pliki:** `- 1.txt` (sekcje 1.2, 1.3) oraz `- 5.txt` (sekcje 5.3, 5.4, 5.8).

---

## Uwaga 7 — Reorganizacja struktury rozdziałów (projekt ↔ implementacja ↔ testy)

> **✅ ZREALIZOWANE** — reorganizacja 5-rozdziałowa wykonana w plikach 1–5.txt.
> Rozdział 2 scalony z treścią dawnego Rozdziału 3 (sekcje 2.7–2.15).
> Nowy Rozdział 3 = dawne sekcje 4.1–4.3 (Projekt i architektura systemu).
> Nowy Rozdział 4 = dawne sekcje 4.4–4.9 (Implementacja, sekcje 4.1–4.6 z sub-sekcjami 4.1.1–4.4.4).
> Wszystkie odwołania rys./tab./sekcji zaktualizowane. Sekcja 1.4 zaktualizowana.

**Problem:** Promotor zauważa brak wyraźnego podziału:
**część teoretyczna | projekt | implementacja | testy/prezentacja**.
Obecna struktura rozdziałów miesza te warstwy:

| Obecny rozdział | Zawartość | Problem |
|---|---|---|
| Rozdz. 2 | Literatura karaoke + analiza aplikacji | OK |
| Rozdz. 3 | Metody i technologie **+ opis systemu** (sekcje 3.8, 3.9) | Teoria zmieszana z projektem |
| Rozdz. 4 | Wymagania + architektura + backend + frontend + silnik + Docker | **Projekt i implementacja razem** |
| Rozdz. 5 | Testy + eksperymenty + podsumowanie | OK |

**Docelowa struktura — 5 rozdziałów:**

```
Rozdział 1 — Wstęp                           (bez zmian)
Rozdział 2 — Analiza literatury i metody     (obecny rozdz. 2 + obecny rozdz. 3)
Rozdział 3 — Projekt i architektura systemu  (sekcje 4.1, 4.2, 4.3 z obecnego rozdz. 4)
Rozdział 4 — Implementacja                   (sekcje 4.4–4.9 z obecnego rozdz. 4)
Rozdział 5 — Testy, wyniki i podsumowanie    (obecny rozdz. 5, bez zmian)
```

---

### Krok 7.1 — Scalenie obecnych rozdz. 2 i 3 w nowy Rozdział 2

**Nazwa nowego rozdziału:** `Rozdział 2 — Analiza literatury i metody`

Zawartość po scaleniu (w tej kolejności):

| Nowa sekcja | Źródło | Tytuł |
|---|---|---|
| 2.1 | obecna 2.1 | Historia i kultura karaoke |
| 2.2 | obecna 2.2 | Przegląd literatury naukowej z zakresu analizy śpiewu |
| 2.3 | obecna 2.3 | Metody detekcji wysokości dźwięku w literaturze |
| 2.4 | obecna 2.4 | Separacja źródeł audio w kontekście karaoke |
| 2.5 | obecna 2.5 | Analiza istniejących aplikacji karaoke |
| 2.6 | obecna 2.6 | Wnioski z analizy — luka w istniejących rozwiązaniach |
| 2.7 | obecna 3.1 | Cyfrowe przetwarzanie sygnałów audio — podstawy |
| 2.8 | obecna 3.2 | Ekstrakcja cech akustycznych |
| 2.9 | obecna 3.3 | Detekcja wysokości dźwięku (pitch detection) |
| 2.10 | obecna 3.4 | Separacja źródeł audio — model Demucs |
| 2.11 | obecna 3.5 | Dopasowanie czasowe — Dynamic Time Warping (DTW) |
| 2.12 | obecna 3.6 | Ocena śpiewu — kryteria i metryki |
| 2.13 | obecna 3.7 | Format UltraStar TXT |
| 2.14 | obecna 3.8 | Stos technologiczny |
| 2.15 | obecna 3.9 | Komunikacja w czasie rzeczywistym — ogólna koncepcja |

**Działania:**
- Plik `- 2.txt`: zmienić nagłówek rozdziału na
  `# Rozdział 2 — Analiza literatury i metody`
- Na końcu pliku `- 2.txt` dokleić całą zawartość pliku `- 3.txt`
  (po zmianie nagłówka `# Rozdział 3` na ciągłość — tj. usunąć
  nagłówek `# Rozdział 3 — Metody i technologie`, zostawić tylko sekcje od `## 3.1`).
- Przenumerować doklejone sekcje: `## 3.1` → `## 2.7`, `## 3.2` → `## 2.8`, …,
  `## 3.9` → `## 2.15`.
- Przenumerować podsekcje 3. poziomu analogicznie:
  `### 3.3.1` → `### 2.9.1`, `### 3.4.1` → `### 2.10.1` itd.
- Zaktualizować odwołania w treści nowego rozdz. 2, np.:
  - „(rys. 3.1)" → „(rys. 2.1)" *(uwaga: rysunki też zyskują nowe numery — patrz krok 7.4)*
  - „opisany w rozdziale 3" → „omówiony w niniejszym rozdziale" lub
    „(zob. rozdz. 2)" tam gdzie potrzeba.
- Plik `- 3.txt` po scaleniu staje się **zbędny** (jego treść jest już w `- 2.txt`).

---

### Krok 7.2 — Wydzielenie nowego Rozdziału 3 (Projekt) z obecnego Rozdziału 4

**Nazwa nowego rozdziału:** `Rozdział 3 — Projekt i architektura systemu`

Zawiera **wyłącznie** sekcje projektowe — bez kodu implementacyjnego:

| Nowa sekcja | Źródło | Tytuł |
|---|---|---|
| 3.1 | obecna 4.1 | Wymagania funkcjonalne i niefunkcjonalne |
| 3.2 | obecna 4.2 | Architektura systemu |
| 3.3 | obecna 4.3 | Model danych |

**Działania:**
- Plik `- 4.txt`: zmienić nagłówek na
  `# Rozdział 3 — Projekt i architektura systemu`.
- Zostawić w tym pliku **tylko** sekcje 4.1, 4.2, 4.3 (do końca opisu
  encji `KaraokeSinging` i rys. 4.1 włącznie).
- Przenumerować: `## 4.1` → `## 3.1`, `## 4.2` → `## 3.2`, `## 4.3` → `## 3.3`.
- Usunąć z sekcji 3.2 (dawne 4.2) odwołanie `(por. rozdział 3)` →
  zastąpić `(por. rozdział 2)`.
- Wszystkie rysunki i tabele w tych sekcjach przenumerować wg kroku 7.4.

---

### Krok 7.3 — Wydzielenie nowego Rozdziału 4 (Implementacja) z obecnego Rozdziału 4

**Nazwa nowego rozdziału:** `Rozdział 4 — Implementacja`

Zawiera sekcje implementacyjne z obecnego rozdz. 4 (z kodem, fragmentami
konfiguracji, diagramami szczegółowymi):

| Nowa sekcja | Źródło | Tytuł |
|---|---|---|
| 4.1 | obecna 4.4 | Backend — AudioVerse.API (.NET 10) |
| 4.1.1 | obecna 4.4.1 | Zarządzanie sesjami i rundami |
| 4.1.2 | obecna 4.4.2 | Baza piosenek i format UltraStar |
| 4.1.3 | obecna 4.4.3 | Komunikacja w czasie rzeczywistym — KaraokeHub i WebSocket |
| 4.1.4 | obecna 4.4.4 | LaboratoryController — moduł pomiarowy |
| 4.2 | obecna 4.5 | Mikroserwisy AI (Python / FastAPI) |
| 4.2.1 | obecna 4.5.1 | audio_pitch — detekcja wysokości dźwięku |
| 4.2.2 | obecna 4.5.2 | sing_score — ocena śpiewu metodą DTW |
| 4.2.3 | obecna 4.5.3 | audio_separate — separacja Demucs |
| 4.3 | obecna 4.6 | Frontend — interfejs użytkownika (React + TypeScript) |
| 4.3.1–4.3.5 | obecne 4.6.1–4.6.5 | (podsekcje frontendu — bez zmian treści) |
| 4.4 | obecna 4.7 | Silnik karaoke — timeline i detekcja pitch |
| 4.4.1–4.4.4 | obecne 4.7.1–4.7.4 | (podsekcje silnika — bez zmian treści) |
| 4.5 | obecna 4.8 | Generowanie raportów PDF — LaboratoryReportPdfService |
| 4.6 | obecna 4.9 | Wdrożenie — Docker Compose |

**Działania:**
- Stworzyć nowy plik lub kontynuację po rozdz. 3 zawierającą sekcje 4.4–4.9
  z obecnego `- 4.txt`.
- Nagłówek: `# Rozdział 4 — Implementacja`.
- Przenumerować: `## 4.4` → `## 4.1`, `## 4.5` → `## 4.2`, …, `## 4.9` → `## 4.6`.
- Przenumerować podsekcje: `### 4.4.1` → `### 4.1.1`, `### 4.5.1` → `### 4.2.1` itd.
- W sekcji 4.1.3 (dawna 4.4.3) — odwołanie do komunikacji WebSocket/SignalR
  jest już kompletne (dodane w poprzedniej rundzie poprawek) — nie trzeba nic dodawać.
- Zaktualizować odwołania wewnątrz tekstu:
  - „zob. rodz. 3" (w kontekście metod) → „zob. rozdz. 2"
  - „opisane w rozdziale 4 (sekcja 4.4.4)" → „opisane w sekcji 4.1.4"
  - rys./tab. przenumerować wg kroku 7.4.

---

### Krok 7.4 — Renumeracja rysunków i tabel

Po zmianie rozdziałów wszystkie numery rysunków i tabel muszą odzwierciedlać
nowy numer rozdziału. Mapowanie:

| Stary numer | Nowy numer | Gdzie zmienić |
|---|---|---|
| rys. 3.1–3.3 | rys. 2.1–2.3 (oraz rys. 2.X dla wszystkich rys. z dawnego rozdz. 3) | nowy `- 2.txt` |
| tab. 3.1–3.2 | tab. 2.1–2.2 (w nowym rozdz. 2, po istniejącej tab. 2.1 — uwaga: stara tab. 2.1 staje się tab. 2.1, nowe z rozdz. 3 → tab. 2.2 i 2.3) | nowy `- 2.txt` |
| rys. 4.1–4.6 | rys. 3.1–3.6 (projekt, nowy rozdz. 3) | nowy `- 3.txt` (projekt) |
| tab. 4.1–4.3 | tab. 3.1–3.3 | nowy `- 3.txt` (projekt) |
| rys. 4.7–4.14 | rys. 4.1–4.8 (implementacja, nowy rozdz. 4) | nowy `- 4.txt` (impl.) |
| rys. 5.1–5.5 | rys. 5.1–5.5 | `- 5.txt` — bez zmian |
| tab. 5.2–5.3 | tab. 5.1–5.2 (tab. 5.1 to dawna 5.2; numeracja zaczyna się od 5.1) | `- 5.txt` |

> **Wskazówka:** najłatwiej zrobić globalny find & replace w edytorze lub
> skryptem: najpierw zamienić numery malejąco (od największych), żeby
> nie powodować kolizji np. `rys. 4.1` → `rys. 3.1` zanim zamieni się
> `rys. 4.10` → `rys. 4.3` itd.
> Kolejność bezpieczna: zamieniać począwszy od najwyższego numeru.

---

### Krok 7.5 — Aktualizacja odwołań między rozdziałami w całej pracy

Po renumeracji rozdziałów wszystkie wzmianki „rozdział X" i „sekcja X.Y"
muszą zostać zaktualizowane. Pełna lista:

**W nowym rozdz. 2 (dawny 2 + 3):**
- Wszystkie „(rozdz. 3)" dotyczące metod → usunąć lub zamienić na
  „w niniejszym rozdziale" / „(zob. sekcja 2.X)".

**W nowym rozdz. 3 (dawny 4.1–4.3):**
- Odwołanie `(por. rozdział 3)` w sekcji 3.2 → `(por. rozdział 2)`.

**W nowym rozdz. 4 (dawny 4.4–4.9):**
- Każde „opisane w rozdziale 3" (metody) → „opisane w rozdziale 2".
- „zob. rozdz. 3.7" (format UltraStar) → „zob. sekcja 2.13".
- „(rozdz. 5)" odsyłające do testów → pozostaje `(rozdz. 5)`.

**W rozdz. 5 (bez zmian treści, tylko odwołania):**
- Lista w sekcji 5.8 — zaktualizować numery rozdziałów:
  ```
  1. Analiza literatury … — zrealizowana w rozdziale 2.
  2. Opis metod AI … — zrealizowany w rozdziale 2 (sekcje 2.7–2.15).
  3. Projekt architektury … — zrealizowany w rozdziale 3.
  4. Implementacja … — zrealizowana w rozdziale 4.
  5. Testy i wyniki … — zrealizowane w niniejszym rozdziale.
  ```
- Odwołania „rozdz. 4.4.4" → `(sekcja 4.1.4)`.
- Odwołania „rozdz. 4" ogólnie (projekt + impl.) → rozróżnić:
  architektura = rozdz. 3, kod = rozdz. 4.

**W rozdz. 1 (Wstęp / Struktura pracy — sekcja 1.4):**
- Zaktualizować opis struktury na nowe 5 rozdziałów:
  ```
  Rozdział 2 — analiza literatury i metody (dawne rozdz. 2 i 3).
  Rozdział 3 — projekt i architektura systemu.
  Rozdział 4 — implementacja.
  Rozdział 5 — testy i podsumowanie.
  ```

---

### Podsumowanie zmian w plikach

| Plik | Akcja |
|---|---|
| `- 1.txt` | Zaktualizować sekcję 1.4 (Struktura pracy) — nowe numery rozdziałów |
| `- 2.txt` | Zmienić nagłówek + dokleić `- 3.txt` z renumeracją sekcji 2.7–2.15 |
| `- 3.txt` | Zastąpić zawartością dawnych sekcji 4.1–4.3 (nowy Rozdz. 3 — Projekt) |
| `- 4.txt` | Zastąpić zawartością dawnych sekcji 4.4–4.9 (nowy Rozdz. 4 — Implementacja) |
| `- 5.txt` | Zaktualizować odwołania do rozdziałów w sekcjach 5.8 i nav-odwołaniach |

---

## Kolejność wdrożenia poprawek (sugerowana)

| Krok | Uwaga | Szacowany nakład |
|------|-------|-----------------|
| 1 | Strona tytułowa (mgr → inż.) | 5 min |
| 2 | Spis treści — 2 poziomy | 10 min (ustawienie w Word) |
| 3 | Usunąć ticki ✓ z 5.8 | 5 min |
| 4 | Złagodzić język badawczy (1.2, 1.3, 5.8) | 20 min |
| 5 | Skrócić 1.1 (usunąć szczegóły implementacji) | 20 min |
| 6 | Dodać odnośniki do wszystkich rys. i tabel | 60–90 min |
| 7 | Przenieść 3.8 i 3.9 do rozdz. 4 | 30 min |
| 8a | Scalenie rozdz. 2 + 3 w nowy Rozdz. 2 (krok 7.1) | 30 min |
| 8b | Wydzielenie nowego Rozdz. 3 — Projekt (sekcje 4.1–4.3) | 20 min |
| 8c | Wydzielenie nowego Rozdz. 4 — Implementacja (sekcje 4.4–4.9) | 20 min |
| 8d | Renumeracja rysunków i tabel (krok 7.4) | 45 min |
| 8e | Aktualizacja odwołań między rozdziałami + sekcja 1.4 (krok 7.5) | 30 min |

**Zalecenie:** Kroki 8a–8e wykonywać w podanej kolejności — scalenie najpierw,
renumeracja na końcu. Przy find & replace numerów rysunków zaczynać od
największych (np. `rys. 4.14` przed `rys. 4.1`), żeby uniknąć kolizji.
