**Tytuł:** Gra wokalna karaoke z wykorzystaniem sztucznej inteligencji

**Autor:** [Imię i nazwisko autora]

**Promotor:** [Imię i nazwisko promotora]

**Streszczenie**

Praca opisuje koncepcję, metody oraz plan eksperymentów dotyczących systemu gry wokalnej (karaoke) wspieranego metodami sztucznej inteligencji. Celem jest zaprojektowanie i ocena metod detekcji wysokości dźwięku (pitch), oceny intonacji użytkownika oraz mechanizmów informacji zwrotnej w formie gry. Dokument zawiera przegląd literatury, szczegółową metodologię, protokół eksperymentu, metryki, oraz załączniki techniczne i skrypty reproducibility.

**Słowa kluczowe:** karaoke, pitch detection, pYIN, CREPE, ocena intonacji, separacja źródeł, reproducibility

**Spis treści (roboczy)**

1. Wstęp
2. Przegląd literatury
3. Cele i założenia
4. Metodologia
5. Proponowany protokół eksperymentu
6. Materiały i dane
7. Wyniki — szablon i formaty
8. Analiza i statystyka
9. Etyka i polityka danych
10. Dyskusja i ograniczenia
11. Podsumowanie
Appendiksy: A — Pseudokod; B — Docker & Reproducibility; C — Rozszerzony przegląd i parametry techniczne

---

1. Wstęp

Krótki wstęp: motywacja i cel pracy — przygotować kompletny, reproducible pipeline do oceny metod estymacji F0 w kontekście aplikacji karaoke. Implementacja aplikacji pozostaje zadaniem autora; niniejszy dokument udostępnia komplet materiałów badawczych.

2. Przegląd literatury (skondensowany)

- Metody klasyczne: autokorelacja, cepstrum, YIN — szybkie i interpretable, słabsze przy akompaniamencie.
- pYIN: probabilistyczne rozszerzenie YIN dla stabilnych trajektorii i estymacji niepewności.
- Metody deep learning: CREPE i warianty — większa odporność na hałas/akompaniament.
- Separacja źródeł: Spleeter, Open-Unmix, Demucs — poprawia SNR wokalu, ale może wprowadzać artefakty.
- Zasoby i benchmarki: MIR-1K, MedleyDB, iKala i inne z oznaczonymi trajektoriami F0.

3. Cele i założenia

Cele:
- Porównać pYIN, CREPE i metodę bazową; ocenić wpływ separacji źródeł; przygotować reproducible pipeline i materiały do analizy.

Założenia:
- Brak badań z udziałem ludzi w tej wersji; ewaluacja techniczna na publicznych i syntetycznych danych.

4. Metodologia

4.1 Pipeline (ogólne)
1. Wczytanie/generacja danych, standaryzacja (WAV PCM16, sr=44100/16000).
2. (Opcjonalnie) Separacja źródeł.
3. Estymacja F0: pYIN + CREPE.
4. Synchronizacja ramek, eksport CSV per-record.
5. Agregacja i analiza statystyczna.

4.2 Preprocessing i parametry
- Resampling: 44.1 kHz preferowane; 16 kHz dopuszczalne.
- Normalizacja RMS (np. −20 dBFS).
- STFT: n_fft=2048, hop_length=256, window=Hann. Alternatywa: n_fft=4096 dla lepszej rozdzielczości freq.
- Filtracja pasmowa: 50–5000 Hz (opcjonalnie).

4.3 Algorytmy i ustawienia
- pYIN: fmin≈50–65 Hz, fmax≈1000–2000 Hz zależnie od zakresu; frame_length zgodny z n_fft; voicing threshold konfigurowalny (0.1–0.3).
- CREPE: step_size≈10 ms; użyć pre-trained modelu; zastosować Viterbi smoothing i próg confidence.
- Separacja: Demucs/Spleeter/Open-Unmix; logować wersję i parametry.

5. Proponowany protokół eksperymentu

- Testy: (A) czyste wokale, (B) syntetyczne miksy (różne SNR), (C) miksy po separacji.
- Dla każdej konfiguracji: zapisać results/per_record/<id>_results.csv oraz manifest eksperymentu.

6. Materiały i dane

- Format wejściowy: WAV PCM16 mono; metadane w JSON: id, source_dataset, processing_steps, separation_used.
- Syntetyczne miksy: generowane przez łączenie ścieżek z kontrolowanym SNR (+0, +6, +12 dB) i augmentacjami (pitch shift ±2 semitony, additive noise).

7. Wyniki — szablon i formaty

Wymagane pliki od autora:
- `results/aggregated_results.csv` — kolumny: method, rmse_mean, rmse_std, accuracy_50c, n_frames
- `results/per_record/<record_id>_results.csv` — kolumny: time,f0_ref,f0_py,f0_crepe,confidence_crepe,frame_valid
- `figures/*` — wykresy PNG/SVG

Przykładowe komendy:

```powershell
python scripts/run_analysis.py --input data/raw --output results/per_record --use_separation
python scripts/aggregate_results.py --input results/per_record --output results/aggregated/aggregated_results.csv
python scripts/plot_results.py --input results/aggregated/aggregated_results.csv --out figures/
```

8. Analiza i statystyka

- Metryki: RMSE (Hz), RMSE (cents), Accuracy@T (T=25,50,100 cents), Voicing Recall, Voicing False Alarm.
- Kalibracja: Brier score, reliability diagrams dla confidence.
- Testy statystyczne: paired tests (Wilcoxon or paired t-test), effect size (Cohen's d), korekta FDR.

9. Etyka i polityka danych

- Korzystanie wyłącznie z publicznych zbiorów lub syntetycznych mikstów; jeżeli autor dostarczy własne nagrania, muszą zawierać krótką notatkę o ich pochodzeniu i zgodzie.
- Anonimizacja metadanych i ograniczony dostęp do surowych nagrań.

10. Dyskusja i ograniczenia

- Ograniczenia: syntetyczne miksy nie zawsze odzwierciedlają nagrania live; separacja wprowadza artefakty; wymogi sprzętowe (GPU) dla modeli deep learning.

11. Podsumowanie

Dokument dostarcza gotowy plan i narzędzia do przeprowadzenia technicznej ewaluacji metod estymacji pitch w kontekście aplikacji karaoke. Po otrzymaniu wyników od autora wstawię szczegółowe tabele i wykresy do rozdziału Wyniki.

---

Appendix A — Pseudokod pipeline

Pseudokod (schematyczny):

for file in dataset:
    y, sr = load_wav(file)
    y = normalize_rms(y)
    if do_separation:
        vocal = separate_vocal(y)
    else:
        vocal = y
    f0_py = yin(vocal, params)
    f0_crepe = crepe_predict(vocal, params)
    synced = align_frames(f0_py, f0_crepe)
    save_csv(file+'_results.csv', synced)
    compute_metrics(synced)
end

Appendix B — Reproducibility (Docker & env)

- `requirements.txt` towarzyszyć będzie skryptom; dołączony przykładowy `Dockerfile` w pracy.
- Zalecane: zapisywać `manifest.json` z informacjami o środowisku, seed, commit hash.

Appendix C — Rozszerzone materiały techniczne (skondensowane)

(Zawiera zwięzłe omówienie autokorelacji, cepstrum, YIN/pYIN, CREPE, separacji źródeł, metryk i propozycji tabel/rysunków. Pełne rozwinięcie dostępne w `Praca_dyplomowa_expansion.md`.)

---

Plik `Praca_dyplomowa_clean.md` jest scaloną i uporządkowaną wersją roboczą. Jeśli chcesz, mogę:
- zastąpić `Praca_dyplomowa.md` tą wersją (nadpisać),
- dodatkowo usunąć duplikaty i zredagować szczegółowe sekcje (np. pełna bibliografia w IEEE),
- wygenerować wersję LaTeX/PDF z tym szkieletem.

Wskaż preferowaną dalszą akcję.
