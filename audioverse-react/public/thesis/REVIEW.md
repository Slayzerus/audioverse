# Przegląd pracy — uwagi redakcyjno-techniczne

> Status: **zaktualizowano** — renumeracja i wszystkie poprawki trywialne zrealizowane.

---

## 🔴 Krytyczne (błędy merytoryczne / formalne)

### 1. Numeracja rysunków — niezgodna z kolejnością pojawienia się w tekście

W polskich i europejskich standardach edytorskich rysunki muszą być numerowane
w kolejności cytowania w tekście. W obecnej wersji pracy kolejność numerów
**nie pokrywa się** z kolejnością ich pojawiania się. Dotyczy to wszystkich rozdziałów
poza rozdziałem 1.

**Rozdział 2** — kolejność pojawienia się vs. numery:

| Poz. w tekście | Sekcja | Numer obecny | Numer poprawny |
|---|---|---|---|
| 1 | 2.5.1 SingStar | Rysunek 2.1 | 2.1 ✓ |
| 2 | 2.5.2 UltraStar | Rysunek 2.3 | 2.2 |
| 3 | 2.5.3 Smule | Rysunek 2.4 | 2.3 |
| 4 | 2.5.6 KaraFun | Rysunek 2.5 | 2.4 |
| 5 | 2.6 AudioVerse | Rysunek 2.2 | 2.5 |

**Rozdział 3** — kolejność pojawienia się:

| Poz. w tekście | Sekcja | Numer obecny | Numer poprawny |
|---|---|---|---|
| 1 | 3.1 (spektrogram) | Rysunek 3.3 | 3.1 |
| 2 | 3.3.4 (trajektoria F0) | Rysunek 3.1 | 3.2 |
| 3 | 3.8 (architektura) | Rysunek 3.2 | 3.3 |

**Rozdział 4** — kolejność pojawienia się (zamieszanie największe):

| Poz. w tekście | Sekcja | Numer obecny | Numer poprawny |
|---|---|---|---|
| 1 | 4.2 | 4.1 | 4.1 ✓ |
| 2 | 4.3 ER diagram | 4.2 | 4.2 ✓ |
| 3 | 4.4 CQRS | 4.8 | 4.3 |
| 4 | 4.4.1 sesje | 4.9 | 4.4 |
| 5 | 4.4.3 JWT/Auth | 4.10 | 4.5 |
| 6 | 4.4.4 Swagger | 4.3 | 4.6 |
| 7 | 4.4.4 pipeline lab | 4.11 | 4.7 |
| 8 | 4.6 routing | 4.12 | 4.8 |
| 9 | 4.6.1 przeglądarka | 4.4 | 4.9 |
| 10 | 4.6.2 rozgrywka | 4.5 | 4.10 |
| 11 | 4.6.3 ranking | 4.6 | 4.11 |
| 12 | 4.6.4 sesje UI | 4.13 | 4.12 |
| 13 | 4.6.5 audio settings | 4.14 | 4.13 |
| 14 | 4.8 Lab UI | 4.15 | 4.14 |
| 15 | 4.9 Docker | 4.7 | 4.15 |

**Rozdział 5** — kolejność pojawienia się:

| Poz. w tekście | Sekcja | Numer obecny | Numer poprawny |
|---|---|---|---|
| 1 | 5.2.3 testy unit | Rysunek 5.4 | 5.1 |
| 2 | 5.3 RMSE bar | Rysunek 5.1 | 5.2 |
| 3 | 5.3 F0 trajektoria | Rysunek 5.5 | 5.3 |
| 4 | 5.4 latencja | Rysunek 5.2 | 5.4 |
| 5 | 5.6 PDF raport | Rysunek 5.3 | 5.5 |

**→ Do decyzji:** czy renumerować wszystkie rysunki (duże, ale formalnie wymagane),
czy zostawić i wytłumaczyć promotorowi że system numeracji jest tematyczny.
Akademicko — renumeracja jest wymagana.

---

### 2. Literówka: „Culture karaoke" (rozdz. 2, §2.1, zdanie 2)

```
Culture karaoke nabrała wymiaru socjologicznego
```

Powinno być:

```
Kultura karaoke nabrała wymiaru socjologicznego
```

Samotne angielskie słowo na początku akapitu w polskim tekście — oczywisty błąd.

---

### 3. Wersja FastAPI niezgodna z rzeczywistością (Tabela 3.2)

W tabeli stosu technologicznego `Tabela 3.2` widnieje:

```
Mikroserwisy AI     | Python 3.11, FastAPI 0.111
```

Faktyczna wersja zainstalowana w kontenerach: **FastAPI 0.135.0**.
Sprawdzić przez `docker exec installer-librosa-1 pip show fastapi`.

---

### 4. Niezgodność liczby linii `LaboratoryReportPdfService` (rozdz. 4.8)

Tekst podaje `652 linie`, faktyczny plik ma **749 linii**.
Drobne, ale konkretna liczba w tekście akademickim powinna być prawdziwa.

---

## 🟠 Istotne (poprawić przed drukiem)

### 5. „UltraStar Deluxe to … klony SingStar" — liczba mnoga

```
UltraStar Deluxe (USDX) to otwarte, wieloplatformowe klony SingStar
```

USDX to jeden projekt, nie kilka klonów. Powinno być:

```
UltraStar Deluxe (USDX) to otwarty, wieloplatformowy klon SingStar
```

---

### 6. Brak cytowania DTW w §1.1 (Wprowadzenie)

W §1.1 DTW (Dynamic Time Warping) jest wymieniony jako jeden z trzech algorytmów
uzasadniających tezę pracy, ale bez cytatu. Przy pierwszym wystąpieniu powinno być `[14]`.

---

### 7. Opis Demucs — wersja w bibliografii nieaktualna (poz. [6])

Tekst powołuje się na „2019/2021" (Hybrid Transformer Demucs) ale pozycja [6]
w bibliografii to tylko arXiv 2019 (`arXiv:1911.13254`). Wersja `htdemucs`
używana w AudioVerse pochodzi z publikacji 2021. Należy albo:
- zaktualizować [6] do nowszej wersji (`arXiv:2111.03600`, Défossez i in., 2021), albo
- dodać [6b] i cytować oba.

---

### 8. Sekcja 4.8 opisuje separację Demucs jako punkt raportu PDF (pkt 7)

```
7. Efekt separacji Demucs — RMSE przed i po separacji z delta %.
```

Rysunek z tą sekcją (015) został usunięty z pracy — ale opis samej sekcji PDF
jest technicznie nadal prawdziwy (PDF nadal ją generuje). Jednak czytelnik może
szukać odpowiadającego rysunku w rozdziale 5, którego nie ma.
Rozwiązanie: dodać notę w nawiasie „(sekcja pomiarowa dostępna w raporcie PDF;
eksperyment porównawczy wykracza poza zakres niniejszej pracy)."

---

## 🟡 Styl i drobne redakcyjne

### 9. Niezgrabny podział linii w §2.2

```
Wynik ten stanowi
naukowe uzasadnienie dla funkcji coachingowej
```

Przerwa linii w środku zdania wygląda jak artefakt Markdown/edytora.
Całość powinna być w jednej linii:

```
Wynik ten stanowi naukowe uzasadnienie dla funkcji coachingowej aplikacji karaoke z automatyczną oceną.
```

---

### 10. Podwójne cytowanie Welcha [13] — §1.3 i §2.2

W nowej wersji §1.3 Welch [13] cytowany jest raz, a w §2.2 ponownie.
To standardowe i poprawne. Jednak warto sprawdzić czy obydwa konteksty
używają tej samej pozycji bibliograficznej — oba odnoszą się do
„regularnego treningu ze sprzężeniem zwrotnym" (ta sama teza, inne miejsce).
OK, nie wymaga zmiany — tylko odnotowane.

---

### 11. Rysunek 5.4 w §5.2.3 opisany jako „Rysunek 5.4" — ale po renumeracji byłby 5.1

Jeśli renumeracja z punktu 1. zostanie wykonana, caption „Rysunek 5.4"
w sekcji 5.2.3 (testy jednostkowe) stanie się „Rysunek 5.1".
Wewnątrz rozdziału 5 zgaduję że caption był nadawany tematycznie
(5.4 — czwarty rysunek), a nie porządkowo. Całość rozwiąże renumeracja.

---

### 12. Tone check: nowy §1.3 — jeden akapit zbyt techniczny po przełomie osobistym

Akapit zaczynający się od:
```
Pierwszym źródłem motywacji jest zatem wiarygodność tej funkcji coachingowej...
```
...powraca do stylu wyliczanki (`Pierwszym… Drugim… Trzecim… Czwarty…`).
Rozważyć de-numerację tych akapitów — zamiast `Pierwszym źródłem…` / `Drugim czynnikiem…`
zastosować płynne przejście:
- `Pierwszym → Ta obserwacja stała się głównym impulsem do pracy.`
- `Drugim → Sprzyja temu równolegle rosnąca...`

Nie jest to błąd — to kwestia stylu. Obecna forma jest akademicko akceptowalna.

---

## ✅ Co działa dobrze

- Struktura pracy (5 rozdziałów, podział na sekcje) — czytelna i logiczna.
- Tabele porównawcze (3.1, 4.3, 5.2, 5.3) — konkretne, dobrze sformatowane.
- Wzory matematyczne (STFT, YIN, DTW, RMSE) — poprawne, czytelne.
- Bibliografi [1]–[14] — wszystkie pozycje cytowane w tekście, brak osieroconych.
- Nowy §1.3 (motywacja) — znacząco bardziej autentyczny niż poprzednia wersja.
- §5.7 dalszy rozwój (nowy punkt o desktop/mobile) — sensowny i spójny z wnioskami.
- Finalne zdanie §5.8 — dobre zamknięcie, ludzkie.

---

## Priorytet działań

| # | Zmiana | Pracochłonność | Status |
|---|---|---|---|
| 1 | Renumeracja rysunków (wszystkie rozdziały) | Duża — ~40 zmian | ✅ Zrobione |
| 2 | „Culture" → „Kultura" | Trywialna | ✅ Zrobione |
| 3 | FastAPI 0.111 → 0.135 | Trywialna | ✅ Zrobione |
| 4 | LaboratoryReportPdfService 652 → 749 | Trywialna | ✅ Zrobione |
| 5 | USDX „klony" → „klon" | Trywialna | ✅ Zrobione |
| 6 | Dodać [14] do DTW w §1.1 | Trywialna | ✅ Zrobione |
| 7 | Zaktualizować [6] Demucs do 2021 | Mała | ✅ Zrobione |
| 8 | Uwaga do sekcji 4.8 pkt 7 | Mała | ✅ Zrobione |
| 9 | Złamanie linii w §2.2 | Trywialna | ✅ Zrobione |
| 10 | Opcjonalna de-numeracja akapitów §1.3 | Mała | ⬜ Do decyzji |
