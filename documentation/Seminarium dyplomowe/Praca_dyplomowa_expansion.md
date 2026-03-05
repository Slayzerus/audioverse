**Rozszerzenie pracy dyplomowej — dodatkowe rozdziały i szczegóły techniczne**

**1. Rozszerzony przegląd literatury**

- **Autokorelacja i metody czasowo-częstotliwościowe:** Omówienie klasycznych metod estymacji tonu opartych na autokorelacji, ich zalet i ograniczeń przy obecności harmonicznych i hałasu. Zestawienie z metodami spektralnymi (cepstrum, harmonic product spectrum) i implikacje dla precyzji w niskich częstotliwościach.

- **YIN i pYIN:** Szczegółowy opis algorytmu YIN — funkcja różnicowa, normalizacja i wybór kandydata fundamentalnego. Rozszerzenie na pYIN: probabilistyczne modelowanie kandydata, voicing decision i integracja z HMM/CRF dla wygładzania trajektorii. Dyskusja implementacyjna: próg voicing, okna analizy, overlap.

- **Modelowe metody oparte na sieciach neuronowych (CREPE i pochodne):** Architektura CREPE (konwolucyjne filtry nad sygnałem surowym), sposoby trenowania, strategie augmentacji danych (pitch-shifting, additive noise), i wpływ rozmiaru okna na rozdzielczość czasową. Omówienie konwersji modeli do ONNX/ONNX Runtime dla szybkości inference oraz dostępnych wariantów typu CREPE-tiny.

- **Separacja źródeł (Demucs, Spleeter, Open-Unmix):** Porównanie architektur (U-Net, Wave-U-Net, ResUNet) i konsekwencje dla algorytmów pitch-tracking (pozostałości wokalu, artefakty). Dyskusja o doborze modelu separacyjnego do eksperymentów porównawczych — kompromis między jakością separacji a tym, jak artefakty wpływają na pomiar pitch.

- **Benchmarki i wcześniejsze prace porównawcze:** Przegląd datasetów (MIREX, MDB-stem, iKala, MIR-1K), metody oceny i jak wcześniejsze prace raportują RMSE, Voicing Recall/Fallacy, Accuracy@T cents. Wskazanie luk badawczych — niewiele prac raportuje pełną kalibrację niepewności modelu.

**2. Rozbudowana metodologia — implementacyjne detale**

- **Preprocessing:** Standard: resampling do 44.1 kHz (lub 16 kHz tam gdzie wymagane przez model), normalizacja RMS, usuwanie DC. Rekomendowane parametry STFT: n_fft=2048, hop_length=256 (równoważne ~5.8 ms przy 44.1 kHz), window=Hann. Rekomendacje alternatywne dla niskich tonów: n_fft=4096 aby uzyskać lepszą rozdzielczość częstotliwościową.

- **Filtry i augmentacje:** Pasmo przepustowe 50 Hz–12 kHz; wysokoprzepustowy filtr o nachyleniu 6 dB/oct przy 50 Hz, jeśli nagrania zawierają silne składowe niskoczęstotliwościowe. Augmentacje stosowane przy tworzeniu datasetu syntetycznego: zmiana wysokości +/− 2 semitonów, dodanie szumów Gaussowskich, kompresja MP3 na różnych bitrate'ach.

- **Parametry algorytmów:** pYIN: frame_length odpowiadający `n_fft`, minF0=50 Hz, maxF0=2000 Hz (dla śpiewu możliwe zawężenie do 60–1000 Hz), voiced/unvoiced threshold ustawiony eksperymentalnie (0.1–0.3). CREPE: okno 1024ms (domyślnie 1024 próbki u 16kHz), stride 10 ms — opisać wpływ na latencję i rozdzielczość.

- **Metoda porównań:** Porównania wykonywane na zestawach: (A) czyste wokale (ground truth f0), (B) miksy syntetyczne (wokal + instrumental), (C) miksy po separacji źródeł. Dla każdego przypadku raport: RMSE(Hz), RMSE(cents), Accuracy@T (T = 10, 25, 50 cents), Voicing Recall, Voicing False Alarm.

**3. Metryki i analiza błędów — szczegóły**

- **RMSE (Hz):** RMSE = sqrt(mean((f_est - f_ref)^2)) — wrażliwe na zakres częstotliwości; uzupełnienie przez RMSE w centach: cents = 1200 * log2(f_est / f_ref).

- **Accuracy@T cents:** Procent obliczeń, gdzie |cents(f_est,f_ref)| ≤ T.

- **Voicing metrics:** Voicing Recall = TP_voiced / (TP_voiced + FN_voiced); Voicing False Alarm = FP_voiced / (FP_voiced + TN_voiced).

- **Kalibracja niepewności:** Jeśli model dostarcza score/confidence, ocenić Brier score oraz krzywe kalibracji (reliability diagrams) w przedziałach confidence-bins.

- **Statystyki porównań:** Paired tests (Wilcoxon signed-rank) dla nieregresywnych rozkładów; efekt size: Cohen's d; korekta wielokrotnych porównań: Benjamini–Hochberg (FDR).

**4. Propozycje rozdziałów wyników i tabel**

- Schemat sekcji wyników:
  - Tabela 1: Zestawienie RMSE i Accuracy@T dla metod na czystych wokalach.
  - Tabela 2: Wyniki na syntetycznych miksach (różne SNR i typy instrumentów).
  - Tabela 3: Wpływ separacji źródeł (porównanie bez separacji / po separacji).
  - Rysunek 1: Boxplot RMSE(cents) dla wszystkich metod.
  - Rysunek 2: Reliability diagrams dla modeli dających confidence.

**5. Dyskusja i interpretacja wyników**

- Wskazać praktyczne implikacje różnic RMSE w centach (np. 50 cents to pół tonu — subiektywnie duża różnica). Porównać, które metody lepiej utrzymują spójność w obecności instrumentów o gęstych harmonicznych.

- Omówienie limitów eksperymentu: syntetyczne miksy nie oddają w pełni realnych artefaktów nagrań live; modele separacyjne wprowadzają specyficzne artefakty, które mogą fałszować estymację f0.

**6. Załączniki techniczne (do dołączenia jako appendiks)**

- **Pseudokod pYIN, CREPE inference pipeline:** Dokładne kroki, obsługa brakujących ramek, interpolacja trajektorii.

- **Przykładowe formaty plików wynikowych:** CSV per-record: columns = [record_id, time_s, f0_ref, f0_est_crepe, f0_est_pyin, voicing_ref, voicing_est_crepe, confidence_crepe, ...].

- **Przykładowe skrypty CLI (wywołania):**
  - `python scripts/run_analysis.py --input data/wavs --out results/per_record`
  - `python scripts/aggregate_results.py --in results/per_record --out results/aggregated/summary.csv`

**7. Krótkie wzmianki metodologiczne do włączenia w finalnym rozdziale**

- Walidacja reproducibility: zapisać seed, wersje pakietów (w `requirements.txt`), commit hash kodu, i snapshot modeli (weigths+config). Zawrzeć przykładowy `Dockerfile` do reproducibility (już opisany w `Praca_dyplomowa.md`).

- Plan publikacji wyników: tabelaryczny raport wraz z CSV i skryptami, aby czytelnik mógł odtworzyć metryki.

---

Plik ten zawiera dodatkowe rozdziały i fragmenty, które można złączyć z głównym plikiem `Praca_dyplomowa.md`. Jeśli chcesz, mogę teraz automatycznie wstrzyknąć te sekcje do `Praca_dyplomowa.md` w logicznych miejscach (np. rozszerzyć Przegląd literatury, Metodologię, Rozdział Wyniki). Wskaż preferowane miejsce w tekście lub pozwól, bym wstawił sekcje po istniejących nagłówkach `Przegląd literatury` i `Metodologia`.
