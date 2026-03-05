**Tytuł:** Gra wokalna karaoke z wykorzystaniem sztucznej inteligencji

**Autor:** [Imię i nazwisko autora]

**Promotor:** [Imię i nazwisko promotora]

**Streszczenie**

Praca opisuje koncepcję, metody oraz plan eksperymentów dotyczących systemu gry wokalnej (karaoke) wspieranej metodami sztucznej inteligencji. Celem jest zaprojektowanie i ocena metod detekcji wysokości dźwięku (pitch), oceny intonacji użytkownika oraz mechanizmów informacji zwrotnej w formie gry, które wspierają naukę i zabawę. W pracy przedstawiono przegląd literatury, metodykę eksperymentalną, propozycję prototypu metod oceny śpiewu oraz plan badań użytkowych. (Szczegóły implementacyjne aplikacji zostaną wstawione po otrzymaniu wyników z repozytorium aplikacji i danych eksperymentalnych.)

**Słowa kluczowe:** karaoke, pitch detection, pYIN, CREPE, ocena intonacji, separacja źródeł, eksperyment użytkowy

**Spis treści (roboczy)**

1. Wstęp
2. Przegląd literatury
3. Cele i założenia
4. Metodologia
5. Proponowany protokół eksperymentu
6. Materiały i dane
7. Oczekiwane wyniki i analiza
8. Etyka i zgoda uczestników
9. Dyskusja i ograniczenia
10. Podsumowanie
11. Bibliografia

Prace przeglądowe i podręczniki, takie jak Lerch (2012) oraz Müller (2021), omawiają praktyczne aspekty implementacji i ograniczenia klasycznych podejść do ekstrakcji podstawowej częstotliwości oraz przetwarzania cech audio [1], [2].

1. Wstęp

Śpiew jest złożonym zadaniem percepcyjno-motorycznym; jego ocena może być realizowana automatycznie przy użyciu technik przetwarzania sygnału dźwiękowego oraz metod uczenia maszynowego. Celem niniejszej pracy jest przygotowanie kompletnych rozdziałów i materiałów badawczych opisujących metody wykorzystywane w systemach karaoke opartych na AI, tak aby po stronie autora (implementatora aplikacji) pozostała jedynie integracja i dostarczenie wyników eksperymentalnych.

2. Przegląd literatury

2.1. Przetwarzanie dźwięku i klasyczne metody estymacji pitch

Klasyczne metody estymacji częstotliwości podstawowej (F0) opierają się na analizie autokorelacji, metodach cepstralnych oraz algorytmie YIN (De Cheveigné & Kawahara). Metody te są efektywne dla sygnałów monofonicznych i w warunkach niskiego poziomu szumów, ale ich dokładność spada w obecności silnego akompaniamentu czy złożonych struktur harmonicznych. Prace przeglądowe i podręczniki, takie jak Lerch (2012) oraz Müller (2021), omawiają praktyczne aspekty implementacji i ograniczenia klasycznych podejść do ekstrakcji podstawowej częstotliwości oraz przetwarzania cech audio [1], [2].

2.2. pYIN i podejścia probabilistyczne

pYIN (Mauch & Dixon, 2014) rozszerza koncepcję algorytmu YIN o model probabilistyczny, który pozwala uzyskać oszacowanie niepewności oraz bardziej stabilne trajektorie F0. pYIN jest szeroko stosowany w zadaniach automatycznej ekstrakcji melodii z nagrań muzycznych i stanowi solidne odniesienie dla porównań metod estymacji pitch w badaniach nad śpiewem [3]. W literaturze wykazano, że pYIN dobrze radzi sobie w warunkach monofonicznych, lecz może wymagać wsparcia separacji źródeł w scenariuszach z akompaniamentem.

2.3. Metody głębokiego uczenia do estymacji pitch


W ostatniej dekadzie pojawiły się rozwiązania oparte na głębokich sieciach neuronowych, które uczą się reprezentacji bezpośrednio z widm czasowo-częstotliwościowych. Przykładem jest CREPE, sieć konwolucyjna zaprojektowana do bezpośredniej estymacji F0 z sygnału audio; takie modele często wykazują lepszą odporność na szum i akompaniament w porównaniu z klasycznymi metodami [4], [5]. Prace te podkreślają także znaczenie dobrej jakości danych treningowych i technik augmentacji w celu uzyskania uogólniających modeli.

2.4. Separacja źródeł i wpływ na zadania pitch

Separacja wokal/akompaniament jest istotnym krokiem preprocessingowym w systemach karaoke. Narzędzia takie jak Spleeter czy Open-Unmix zostały zaprojektowane do wydzielania ścieżek wokalnych i instrumentalnych i mogą znacząco poprawić jakość estymacji F0 poprzez redukcję interferencji harmonicznych akompaniamentu [6]. Jednak separacja może wprowadzać artefakty, dlatego wpływ na końcową jakość estymacji pitch wymaga empirycznej oceny.

2.5. Metryki oceny i metodologia eksperymentalna

W literaturze stosuje się metryki obiektywne (np. RMSE F0, accuracy w progu centów) oraz metody subiektywne (ankiety, oceny ekspertów) do oceny jakości estymacji i użyteczności systemów feedbacku. Przykłady badań o charakterze eksperymentalnym i metodologicznym znajdują się w pracach dotyczących analizy intonacji i oceny głosu [7], [8].

2.6. Aspekty użytkowe karaoke i badania socjokulturalne

Poza technicznymi aspektami estymacji pitch istnieje obszerna literatura dotycząca roli karaoke w kulturze i społeczeństwie, która dostarcza kontekstu dla projektowania interakcji i motywacji użytkowników. Pozycje takie jak Mitsui & Hosokawa (1998) oraz Drew (2001) opisują historyczne i socjologiczne perspektywy karaoke, co jest przydatne przy definiowaniu kryteriów oceny UX i akceptowalności rozwiązań [9], [10].

2.7. Prace referencyjne i zasoby

Kluczowe podręczniki i pozycje przeglądowe (Müller 2021, Lerch 2012, Jurafsky & Martin 2023) dostarczają solidnego tła teoretycznego zarówno dla sygnałowego, jak i językowego aspektu analizy śpiewu i mowy [2], [1], [11]. Dalsze prace z zakresu separacji źródeł i deep learningu uzupełniają kontekst implementacyjny i badawczy [4], [7].



3. Cele i założenia

Główne cele pracy:
- przygotować kompletne rozdziały literaturowe i metodologiczne gotowe do integracji z wynikami praktycznymi;
- opracować protokół eksperymentu użytkownika i materiały (kwestionariusz, zgoda);
- dostarczyć skrypty demonstracyjne do offlineowej detekcji pitch i wstępnej oceny intonacji.

Założenia:
- implementacja aplikacji (runtime, UI, integracja) prowadzona jest w oddzielnym repozytorium przez autora;
- analiza metod i eksperymenty możliwe będą po otrzymaniu wyników z aplikacji (CSV/JSON i/lub nagrania).

4. Metodologia

4.1. Preprocessing

Przed estymacją pitch sygnały audio będą normalizowane i, w razie potrzeby, poddawane filtracji pasmowej oraz separacji ścieżek (jeżeli wymagane jest oddzielenie akompaniamentu od głosu). Do separacji źródeł można użyć narzędzi takich jak Open-Unmix lub Spleeter (przykładowo) [4].

4.2. Metody estymacji wysokości

- pYIN: metoda oparta na probabilistycznych rozkładach i adaptacjach algorytmu YIN, dobre wyniki dla sygnałów monofonicznych i melody extraction [3].
-- CREPE i sieci neuronowe: end-to-end estymacja F0 bazująca na modelach konwolucyjnych, skuteczna w obecności szumów i w muzyce wielogłosowej [26], [10].

Opis implementacyjny (roboczy):
- parametry okna: 2048 próbek, hop 256 (przykładowo), z oknem Hanninga;
- próbkowanie: 44.1 kHz lub 16 kHz zależnie od scenariusza;
- wyjście: ciąg estymowanych wartości F0 wraz z pewnością/score per frame.

4.3. Metryki oceny

- F0 RMSE: pierwiastek średniego błędu kwadratowego pomiędzy referencyjnym a estymowanym F0;
- Accuracy w tolerancie semitonowej: procent ramek, w których estymowana wartość mieści się w zadanym progu (np. ±50 centów);
- Metryki subiektywne: ankieta użytkownika dotycząca satysfakcji, użyteczności i percepcji opóźnień.

4.4. Analiza jakości i statystyka

Zastosowanie testów statystycznych (np. test t-Studenta lub testy nieparametryczne) do porównania wyników różnych metod; wizualizacje rozkładów błędów, confusion matrix dla dyskretnych ocen.


5. Proponowany protokół ewaluacji technicznej

5.1. Cel ewaluacji

Ocenić dokładność i stabilność algorytmów estymacji F0 (pYIN, CREPE, metoda bazowa) oraz wpływ separacji źródeł na wyniki, przy użyciu publicznych zbiorów danych i syntetycznych miksów. Nie przewiduje się badań z udziałem testerów/uczestników — cały proces ewaluacji ma charakter techniczny i reprodukowalny.

5.2. Zasady doboru danych

- Wykorzystać istniejące, publicznie dostępne zbiory referencyjne (np. melody extraction datasets, datasety z oznaczonymi F0) oraz wygenerować syntetyczne miksy: vocal + instrument backing z kontrolowanym SNR.
- Dla każdego testu podać wersję źródła danych, licencję, oraz sposób przygotowania miksu (SNR, filtry), zapisać w metadanych.

5.3. Scenariusz testów technicznych

- Testy podstawowe: estymacja F0 na czystym wokalu (baseline). 
- Testy z akompaniamentem: estymacja F0 na surowym miksie oraz po separacji (vocal track) z użyciem Spleeter/Open-Unmix.
- Testy odpornościowe: dodanie szumów o różnym poziomie SNR oraz transformacje (pitch shift, time-stretch) by ocenić stabilność metod.
- Dla każdej konfiguracji wygenerować wyniki per nagranie (`results/per_record/`) oraz agregować do tabel zbiorczych.

5.4. Dane zapisywane

- pliki audio: źródła i wygenerowane miksy (`data/`), z powiązanymi plikami JSON metadanych;
- pliki wynikowe algorytmów: estymacje F0 per frame, confidence, `results/per_record/<id>_results.csv`;
- pliki agregowane: `results/aggregated/aggregated_results.csv` oraz dodatkowe statystyki.


6. Materiały i dane (ewaluacja techniczna)

6.1. Źródła danych

- Publiczne zbiory referencyjne: wybór datasetów z oznaczonymi trajektoriami F0 (np. MIR-1K, MedleyDB, i inne z literatury). Każdy wykorzystany dataset należy opisać (autor, licencja, zakres oznaczeń F0).
- Syntetyczne miksy: generowane przez łączenie ścieżek wokalnych i instrumentalnych z regulacją SNR (np. +0, +6, +12 dB) i zastosowaniem prostych transformacji (pitch shift, time-stretch) do testów odpornościowych.

6.2. Przygotowanie danych i metadane

- Standardowe formaty: WAV PCM16, `sr=44100`, mono; każdy plik posiada plik JSON z metadanymi: `id, source_dataset, original_file, processing_steps, separation_used`.
- Checklista jakości: minimalna długość 3 s, brak clippingu, dostateczne SNR. Zautomatyzować kontrolę i logować wyniki kontroli jakości.

6.3. Brak badań z udziałem ludzi

Praca inżynierska koncentruje się na ocenie algorytmicznej; dlatego nie przewiduje się rekrutacji uczestników ani kwestionariuszy. Wszelkie odniesienia do formularzy zgody i ankiet zastąpiono opisem wykorzystania publicznych danych i generacji syntetycznych próbek.

7. Oczekiwane wyniki i analiza

Przewiduje się, że metody oparte na głębokich sieciach (CREPE/analogiczne) osiągną wyższą odporność na akompaniament i szumy, natomiast pYIN zaoferuje stabilność i interpretowalność w scenariuszach monofonicznych. Analiza porównawcza zostanie przeprowadzona po otrzymaniu wyników z aplikacji.
 
7.1. Szablon sekcji Wyniki — instrukcje i formaty plików

- **Cel sekcji:** Czytelne przedstawienie wyników eksperymentów ilościowych i jakościowych oraz ich interpretacja.
- **Struktura:** Krótki opis zestawu danych → opis przetwarzania → tabele wyników → wykresy → analiza statystyczna → krótkie wnioski.
- **Wymagane pliki od autora:**
	- `results/aggregated_results.csv` — kolumny: `method,rmse_mean,rmse_std,accuracy_50c,n_frames`
	- `results/per_record/<record_id>_results.csv` — kolumny: `time,f0_ref,f0_py,f0_crepe,confidence_crepe,frame_valid`
	- `figures/*` — wykresy (PNG lub SVG), nazwy: `fig_RMSE_boxplot.png`, `fig_f0_trajectory_<id>.png`, etc.
- **Format tabel w dokumencie:** preferowane Markdown lub LaTeX; przykładowa tabela Markdown:

	| Metoda | RMSE mean (Hz) | RMSE std | Accuracy@50c (%) |
	|---|---:|---:|---:|
	| pYIN | 12.3 | 3.4 | 78.2 |

- **Wykresy:**
	- Preferowane: SVG (wektor) lub PNG (min. 1200×800 px) dla publikacji; umieścić pliki w `figures/`.
	- Trajektorie F0: nakładać metody na jednej osi czasu; sygnalizować fragmenty nieważne (`frame_valid=false`).
- **Skrypty i reprodukowalność:** Dołączyć skrypt `scripts/aggregate_results.py` który generuje `aggregated_results.csv` z folderu `results/per_record/` oraz `scripts/plot_results.py` generujący pliki w `figures/`.
- **Nazewnictwo i organizacja folderów:**
	- `results/per_record/` — pliki per nagranie
	- `results/aggregated/` — tabele zbiorcze
	- `figures/` — obrazy użyte w pracy
- **Dodatkowe wskazówki:**
	- Podawać jednostki (Hz, %).
	- W opisie tabel/rysunków umieszczać krótki komentarz metodologiczny (jak obliczono RMSE, próg centów itp.).
	- Do raportu załączyć plik `README_results.md` w katalogu `results/` opisujący proces generacji wyników i wymagane komendy.


8. Polityka danych i etyka (dot. danych technicznych)

Ponieważ praca nie obejmuje badań z udziałem ludzi, etyczne aspekty koncentrują się na prawidłowym wykorzystaniu zewnętrznych zbiorów danych: sprawdzeniu licencji, cytowaniu źródeł, anonimizacji metadanych (jeżeli korzysta się z nagrań zawierających identyfikowalne informacje) oraz bezpiecznym przechowywaniu wyników. Jeśli autor dostarczy własne nagrania, należy do nich dołączyć krótką notatkę o ich pochodzeniu i zgodzie na wykorzystanie (w dokumentacji projektu), ale nie będzie to częścią badania z testerami.

9. Dyskusja i ograniczenia

Ograniczenia pracy wynikają głównie z braku gotowej integracji aplikacji w repozytorium oraz od jakości i liczby nagrań testowych. Metodyczne porównanie jest możliwe dopiero po dostarczeniu danych eksperymentalnych.

10. Podsumowanie

Praca dostarcza kompletny szkielet teoretyczny i metodologiczny dla projektu „Gra wokalna karaoke z wykorzystaniem sztucznej inteligencji”. Po stronie autora pozostaje implementacja aplikacji oraz uruchomienie eksperymentów; po ich otrzymaniu dokończę rozdziały Wyniki i Dyskusja oraz zaktualizuję bibliografię i przypisy.

---

**Bibliografia (wybrane pozycje z `Bibliografia.bib`)**

1. Meinard Müller. Fundamentals of Music Processing: Using Python and Jupyter Notebooks. 2nd ed., Springer, 2021.
2. Alexander Lerch. An Introduction to Audio Content Analysis: Applications in Signal Processing and Music Informatics. Wiley, 2012.
3. Curtis Roads. The Computer Music Tutorial. 2nd ed., MIT Press, 2023.
4. Anssi Klapuri and Manuel Davy (eds.). Signal Processing Methods for Music Transcription. Springer, 2006.
5. Daniel Jurafsky and James H. Martin. Speech and Language Processing. 3rd draft, 2023.
6. Ben Gold, Nelson Morgan, Dan Ellis. Speech and Audio Signal Processing: Processing and Perception of Speech and Music. 2nd ed., Wiley, 2011.
7. Marina Bosi and Richard E. Goldberg. Introduction to Digital Audio Coding and Standards. Springer, 2003.
8. Philippos C. Loizou. Speech Enhancement: Theory and Practice. 2nd ed., CRC Press, 2013.
9. Emmanuel Vincent, Tuomas Virtanen, Shoji Makino (eds.). Audio Source Separation and Speech Enhancement. Wiley, 2018.
10. Geoffroy Peeters and Gaël Richard. Deep Learning for Audio and Music. Handbook of Signal Processing Systems, Springer, 2021.
11. Graham F. Welch et al. The Oxford Handbook of Singing. Oxford University Press, 2019.
12. Toru Mitsui and Shuhei Hosokawa (eds.). Karaoke Around the World: Global Technology, Local Singing. Routledge, 1998.
13. Rob Drew. Karaoke Nights: An Ethnographic Rhapsody. Rowman & Littlefield, 2001.
14. Kevin Brown. Karaoke Idols: Popular Music and the Performance of Identity. Intellect, 2015.
15. Zygmunt Ciota. Metody przetwarzania sygnałów akustycznych w komputerowej analizie mowy. Wydawnictwo EXIT, 2022.
16. Tomasz Zieliński. Cyfrowe przetwarzanie sygnałów. Od teorii do zastosowań. Wydawnictwo Komunikacji i Łączności, 2009.
17. Krzysztof J. Opieliński (ed.). Postępy badań w inżynierii dźwięku i obrazu. Pomiary, przetwarzanie, klasyfikacja i ocena jakości sygnałów audio-wideo. Oficyna Wydawnicza Politechniki Wrocławskiej, 2023.
18. Dag Stranneby. Cyfrowe przetwarzanie sygnałów. Metody, algorytmy, zastosowania. Wydawnictwo BTC, 2004.
19. Wojciech Butryn. Dźwięk cyfrowy. Systemy wielokanałowe. Wydawnictwo Komunikacji i Łączności, 2005.
20. Anna Kołakowska. Przetwarzanie mowy w systemach komputerowych – wybrane metody. Elektronika, 2017.
21. Wojciech Kasprzak. Analiza i synteza głosu ludzkiego – wybrane zastosowania. Przegląd Telekomunikacyjny i Wiadomości Telekomunikacyjne, 2018.
22. Krzysztof Wójcicki. Metody analizy intonacji w śpiewie i mowie. Studia Informatica, 2019.
23. Emilia Gómez. Tonal Description of Polyphonic Audio for Music Content Processing. INFORMS Journal on Computing, 2006.
24. Justin Salamon and Emilia Gómez. Melody Extraction from Polyphonic Music Signals Using Pitch Contour Characteristics. IEEE Transactions on Audio, Speech, and Language Processing, 2012.
25. Matthias Mauch and Simon Dixon. pYIN: A Fundamental Frequency Estimator Using Probabilistic Threshold Distributions. Proceedings of ICASSP, 2014.
26. Eric J. Humphrey, Juan P. Bello, Yann LeCun. Moving Beyond Feature Design: Deep Architectures and Automatic Feature Learning in Music Informatics. Proceedings of ISMIR, 2012.
 

(Pełna bibliografia w pliku `Bibliografia.bib`.)

---

Notatka: mogę rozszerzyć każdy rozdział (szczegółowe opisy algorytmów, kod przykładowy w formacie Jupyter Notebook, i pełne przypisy z formatowaniem APA/IEEE) oraz wstawić rzeczywiste wyniki i cytowania po dostarczeniu plików wynikowych z aplikacji.

---

ROZDZIAŁY SZCZEGÓŁOWE (rozwinięcie)

1. Wstęp (rozwinięcie)

1.1. Motywacja

Rozwój systemów interaktywnych opartych na analizie dźwięku i sztucznej inteligencji umożliwia tworzenie aplikacji edukacyjnych i rozrywkowych, które wspierają użytkownika w nauce śpiewu oraz monitorowaniu jakości wydobywanego głosu. Karaoke jako popularna forma aktywności muzycznej stanowi naturalne środowisko do wprowadzenia mechanizmów oceny i informacji zwrotnej. Celem pracy jest połączenie metod przetwarzania dźwięku i uczenia maszynowego w prototypie gry wokalnej, wraz z walidacją jakościową i ilościową.

1.2. Zakres pracy

Praca skupia się na teoriach i metodach niezbędnych do oceny intonacji i jakości śpiewu: detekcja F0, separacja źródeł, metody uczenia głębokiego do estymacji pitch, oraz projekt eksperymentu użytkowego. Implementacja front-endu i integracja real-time w aplikacji pozostaje poza zakresem wykonawczym tego dokumentu i ma być dostarczona przez autora w osobnym repozytorium.

2. Przegląd literatury (rozwinięcie)

2.1. Estymacja wysokości (pitch) — podejścia klasyczne

Tradycyjne metody estymacji F0 obejmują analizę autocorrelation, metody cepstralne i algorytm YIN (De Cheveigné & Kawahara). Algorytmy te są szybkie i często dają dobre wyniki dla sygnałów czystych i monofonicznych, ale wykazują ograniczenia w przypadku akompaniamentu oraz harmonicznych nakładających się na głos.

2.2. pYIN i probabilistyczne podejścia

pYIN (Mauch & Dixon, 2014) rozszerza YIN o model probabilistyczny, dostarczając oszacowania związanego z niepewnością oraz mechanizmy wygładzania trajektorii pitch. pYIN jest wykorzystywany szeroko do ekstrakcji melodii z nagrań muzycznych i jest dobrym punktem odniesienia w eksperymentach oceny intonacji [3].

2.3. Metody uczące się (deep learning)

Modele głębokie, takie jak CREPE (Convolutional REpresentation for Pitch Estimation), dowiodły, że sieci konwolucyjne mogą bezpośrednio estymować F0 z surowego widma amplitudowego bez potrzeby projektowania cech manualnych. Takie podejścia często osiągają lepszą odporność na interferencje akompaniamentu i szum.

2.4. Separacja źródeł i przetwarzanie sygnału

Separacja wokal/akompaniament (np. Spleeter, Open-Unmix) może znacząco poprawić jakość detekcji pitch, szczególnie przy obecności głośnych instrumentów. W literaturze porównano metody separacji pod kątem zachowania informacji harmonicznej głosu oraz minimalizacji artefaktów wpływających na estymację F0 [4].

2.5. Ocena subiektywna i metody eksperymentalne

Ocena jakości śpiewu łączy metryki obiektywne (np. RMSE F0, procent ramek w progu) oraz metody subiektywne (ankiety, oceny ekspertów). Ważne jest zaprojektowanie protokołu eksperymentalnego minimalizującego bias i zapewniającego powtarzalność.

3. Cele i założenia (rozwinięcie)

3.1. Szczegółowe cele badawcze

- Porównać wybrane metody estymacji pitch (pYIN vs CREPE vs metoda bazowa z librosa) pod kątem dokładności na zestawie nagrań testowych.
- Ocenić wpływ separacji źródeł na jakość estymacji F0.
- Zaprojektować i przetestować mechanizmy feedbacku w formie gry (np. wizualizacja ścieżki pitch, scoring intonacji) pod kątem akceptacji użytkowników.

3.2. Hipotezy

- H1: Metody oparte na sieciach głębokich osiągną niższy RMSE F0 niż klasyczne metody na nagraniach z akompaniamentem.
- H2: Dodanie modułu separacji źródeł poprawi wskaźniki dokładności estymacji pitch dla wszystkich metod.

4. Metodologia (rozwinięcie)

4.1. Pipeline przetwarzania

Cały pipeline badawczy składa się z następujących etapów:

1. Wczytanie i standaryzacja nagrań (16/44.1 kHz, normalizacja RMS).
2. (Opcjonalnie) Separacja wokalu i akompaniamentu.
3. Estymacja F0 metodami pYIN i CREPE.
4. Porównanie trajektorii F0 z referencyjnymi etykietami (gdy dostępne) lub porównanie pomiędzy metodami.
5. Agregacja metryk i analiza statystyczna.

4.2. Parametry eksperymentalne i implementacyjne

- Okno STFT: 2048, hop: 256;
- Filtracja: opcjonalny filtr pasa 80–5k Hz dla glosu;
- Model CREPE: wersja pre-trained (np. crepe 512Hz), z ewentualnym fine-tuningiem na danych śpiewanych;
- pYIN: domyślne parametry implementacji w librosa/przyjęte w literaturze.

4.3. Metryki (formuły)

F0 RMSE:
$$RMSE = \sqrt{\frac{1}{N} \sum_{i=1}^N (f_{0,i}^{ref} - f_{0,i}^{est})^2}$$

Accuracy w progu centów (np. ±50 centów):
$$Accuracy = \frac{1}{N} \sum_{i=1}^N \mathbf{1}\left( |1200 \log_2\frac{f_{0,i}^{est}}{f_{0,i}^{ref}}| \leq threshold\right)$$

Gdzie $f_{0,i}^{ref}$ to referencyjna częstotliwość fundamentalna dla ramki $i$, a $f_{0,i}^{est}$ to wartość estymowana.

4.4. Walidacja i testy statystyczne

Po obliczeniu metryk dla każdego nagrania przeprowadzimy testy statystyczne (np. Wilcoxon lub test t zależny) w celu oceny istotności różnic między metodami.

5. Implementacja (opis roboczy — bez aplikacji)

5.1. Moduły proponowanego prototypu

- Preprocessing: wczytywanie plików WAV, normalizacja, opcjonalne usuwanie szumów.
- Separacja źródeł: integracja z Spleeter/Open-Unmix (wywołanie procesu i wczytanie ścieżek).
- Estymacja pitch: moduł uruchamiający pYIN (librosa.yin/pipline) i CREPE (model pre-trained), zwracający trajektorie F0 oraz pewności.
- Ocena i scoring: obliczanie RMSE, accuracy, generowanie wykresów i plików CSV.

5.2. Przykładowy fragment kodu (Python, demonstracyjny)

```python
import librosa
import numpy as np

y, sr = librosa.load('sample.wav', sr=44100)
f0_py = librosa.yin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))

# CREPE pseudo-call (w praktyce import crepe i użycie predict)
# f0_crepe, confidence = crepe.predict(path, sr, step_size=10, viterbi=True)

```

5.3. Wstawianie wyników do pracy

Autor po uruchomieniu eksperymentów powinien dostarczyć:
- pliki CSV z kolumnami: timestamp, f0_ref (jeśli dostępne), f0_py, f0_crepe, confidence_py, confidence_crepe;
- wykresy trajektorii F0 (png/svg);
- pliki z ankietami (CSV) z ocenami subiektywnymi.

5.4. Integracja z backendem AudioVerse (przykład implementacji serwera)

W celu odwołania się do rzeczywistej implementacji backendu użyto dokumentacji projektu serwisów AudioVerse: [README-AudioVerse.API.md](README-AudioVerse.API.md) oraz [README-ResourceLibrary.API.md](README-ResourceLibrary.API.md). Poniżej opisano, jak elementy proponowanego pipeline'u mapują się na konkretne endpointy, mikroserwisy i wzorce architektoniczne tego systemu.

- Pitch detection (file + live): w AudioVerse dostępny jest endpoint `POST /api/AiAudio/pitch` (file mode) oraz WebSockety dla trybu live (`/api/AiAudio/pitch/ws/server` oraz `/api/AiAudio/pitch/ws/client`). Implementacja serwera opiera się na `torchcrepe` (resampling do 16 kHz), a klient może używać `crepe-wasm` lub lokalnego estymatora; format PCM dla streamów to s16le, 16000 Hz, mono. Szczegóły i przykłady wywołań znajdują się w [README-AudioVerse.API.md](README-AudioVerse.API.md).

- Singing scoring: AudioVerse udostępnia `POST /api/AiAudio/score` (offline) oraz WebSocket dla live scoringu (`GET /api/AiAudio/score/live`). Mechanika oceny w microservice `sing_score` wykorzystuje ekstrakcję pitch (CREPE/pYIN jako fallback) oraz dopasowanie sekwencji (DTW). W rozdziale Wyniki wykorzystamy ten wzorzec (plik `results/per_record/*`) jako referencję przy porównaniach metryk i algorytmów.

- Source separation: endpoint `POST /api/AiAudio/separate` wywołuje microservice `ai/audio_separate` (Demucs — `mdx_extra_q` lub `htdemucs`), zwraca `stems.zip` z oddzielonymi ścieżkami. W protokole ewaluacji technicznej wykorzystamy separację jako opcjonalny krok preprocessingowy i porównamy wyniki estymacji F0 przed i po separacji (konfiguracje `stems=2` i `stems=4`).

- YouTube search i integracja multimediów: AudioVerse zawiera `YouTubeService` korzystający z YouTube Data API v3 do wyszukiwania i pobierania `videoId` (konfiguracja `YouTube:ApiKey`). Sekcja materiały/źródła w pracy odnotowuje, że import i pobieranie materiałów testowych (tam, gdzie licencja pozwala) może być zautomatyzowane przy użyciu tego serwisu.

- Architektura i praktyczne wskazówki: AudioVerse stosuje mikroserwisowy podział odpowiedzialności (pitch, score, separation), exposes health/metrics endpoints (Prometheus) oraz wzorce CQRS w module karaoke. Implementacja ACL, wersjonowania piosenek (snapshot JSON) i handlerów CQRS opisana jest w [README-AudioVerse.API.md](README-AudioVerse.API.md) — rozważenia te posłużą do krótkiego case study architektury backendu w rozdziale Implementacja.

- Modele i wymagania: dokumentacja wymienia `torchcrepe` (serwer), `crepe-wasm`/ONNX (klient), Demucs dla separacji oraz opcjonalne `onnxruntime` dla DeepF0. W pracy uwzględniono wpływ wymagań sprzętowych (CPU/GPU) na wybór strategii testowania (serwerowe vs klient-side inferencje) i na pomiary wydajności (latency/CPU).

- Praktyczne mapowanie do wyników: przykładowe pliki wynikowe generowane przez AudioVerse (pitch track, voiced_mask, confidence, score) dostosowują się do formatu `results/per_record/<id>_results.csv` opisanym wcześniej — dzięki temu porównania między lokalnymi implementacjami (pYIN/CREPE) i produkcyjnym serwisem są bezpośrednio porównywalne.

W pracy odwołam się bezpośrednio do fragmentów dokumentacji serwera w następujących miejscach: opis modułów w implementacji (sekcja 5), dyskusja o wydajności i latencji (rozdział Wyniki i Dyskusja) oraz propozycje rozbudowy systemu i dalsze prace (Załącznik/Appendix). Pełne README serwisów zostały dołączone do repozytorium: [README-AudioVerse.API.md](README-AudioVerse.API.md) i [README-ResourceLibrary.API.md](README-ResourceLibrary.API.md).

6. Proponowany protokół eksperymentu (rozwinięcie)

6.1. Szczegóły procedury

- Uczestnik zapoznaje się z instrukcją i podpisuje formularz zgody.
- Wykonuje serię prób kontrolnych: skala (do, re, mi...), krótka fraza melodyczna (3–5 sekund).
- (Jeżeli aplikacja dostępna) Wykonuje zadanie w prototypie gry: ocena intonacji i otrzymanie feedbacku.
- Po każdym bloku wypełnia kwestionariusz: subiektywna ocena trudności i przydatności feedbacku.

6.2. Kwestionariusz (szablon)

- Płeć, wiek, doświadczenie muzyczne (lata), poziom samodzielnej oceny umiejętności śpiewu (Likert 1–5).
- Ocena przydatności feedbacku (1–5).
- Ocena zauważalnej poprawy intonacji (1–5) po sesji.

7. Oczekiwane wyniki i analiza (rozwinięcie)

7.1. Analiza ilościowa

Porównanie RMSE i accuracy pomiędzy metodami, analiza wpływu separacji źródeł oraz wizualizacje: boxploty RMSE, wykresy rozrzutu error vs confidence.

7.2. Analiza jakościowa

Tematyczna analiza odpowiedzi subiektywnych, streszczenie opinii uczestników, wskazanie elementów UX wymagających poprawy (opóźnienia, zrozumiałość feedbacku).

8. Etyka i zgoda uczestników (rozwinięcie)

8.1. Prywatność danych

Dane będą anonimizowane; identyfikatory uczestników zastąpione losowymi kodami. Nagrania będą przechowywane na zabezpieczonym dysku, a dostęp ograniczony do zespołu badawczego.

8.2. Formularz zgody (szablon)

Formularz powinien zawierać: cel badania, rodzaj zbieranych danych, dobrowolność udziału, możliwość wycofania się, informacje o anonimizacji i planie publikacji wyników.

9. Dyskusja i ograniczenia (rozwinięcie)

Główne ograniczenia to:
- ograniczona liczba uczestników może wpływać na moc statystyczną testów;
- jakość nagrań i warunki akustyczne w znacznym stopniu wpływają na poprawność estymacji F0;
- brak pełnej integracji aplikacji w czasie pisania pracy ogranicza możliwość testów real-time.

10. Podsumowanie (rozwinięcie)

Praca dostarcza wyczerpujący plan badawczy i techniczny oraz gotowe materiały do przeprowadzenia testów empirycznych. Po dostarczeniu wyników eksperymentów od autora włączę szczegółowe analizy, tabele i końcowe wnioski.

11. Załączniki

A. Szablon kwestionariusza (CSV)

B. Przykładowy kod (Jupyter Notebook) — opis i lista komórek do uruchomienia

C. Spis potencjalnych ilustracji i ich opisy (przykładowe nagłówki):
- Schemat architektury systemu (Preprocessing → Separation → Pitch Estimation → Feedback)
- Wykres porównawczy RMSE pomiędzy metodami
- Przykładowy UI mockup z wizualizacją ścieżki pitch

<< zrzut ekranu: schemat architektury systemu (diagram blokowy) — plik: figures/schemat_pipeline.png >>
<< zrzut ekranu: przykładowy wykres RMSE (boxplot) — plik: figures/fig_RMSE_boxplot.png >>
<< zrzut ekranu: UI mockup z wizualizacją pitch i scoring — plik: figures/ui_mockup_pitch.png >>

---

Jeśli chcesz, rozwinę teraz: (A) szczegółowy rozdział Metodologia z pseudokodem i parametrami eksperymentów, (B) kompletny Jupyter Notebook demonstracyjny do detekcji pitch offline, albo (C) dopracuję przypisy i pełne formatowanie cytowań zgodnie z normą (APA/IEEE). Wybierz jedną opcję.

---

ROZDZIAŁY ROZSZERZONE (dodatkowa treść "mięsa")

12. Szczegółowy opis algorytmów detekcji pitch

12.1. Autokorelacja i metody cepstralne

Autokorelacja polega na obliczeniu poziomu korelacji sygnału z jego przesuniętą kopią; maksimum autokorelacji odpowiada okresowi fali, a stąd F0 = 1/T. Cepstrum wykorzystuje transformację logarytmu widma i odwrotną transformację Fouriera do wydzielenia składowej harmonicznej. Obie techniki są proste i szybkie, ale w obecności silnych harmonicznych akompaniamentu ich dokładność spada.

12.2. Algorytm YIN i pYIN

Algorytm YIN wykorzystuje funkcję różnicową do identyfikacji okresu sygnału z mniejszym wpływem składowych harmonicznych. pYIN wprowadza model probabilistyczny i wygładzanie trajektorii, co daje bardziej spójne rezultaty w obecności niepewności. Formalnie funkcja różnicowa YIN to:
$$d(\tau) = \sum_{j=1}^{W} (x_j - x_{j+\tau})^2$$
gdzie $\tau$ to opóźnienie (lag), a $W$ to długość okna. YIN normalizuje tę funkcję i wybiera odpowiednie minima jako kandydatów na okres.

12.3. Sieci konwolucyjne (CREPE)

CREPE zakłada bezpośrednie mapowanie z surowego sygnału (lub okna widmowego) do estymowanej częstotliwości F0, traktując zadanie jako regresję. Architektura składa się z szeregu warstw konwolucyjnych, poolingów i warstw gęstych, kończących się predykcją rozkładu prawdopodobieństwa na dyskretnych binach częstotliwości (co ułatwia obliczanie pewności predykcji).

12.4. Porównanie właściwości metod

- Złożoność obliczeniowa: metody klasyczne są lżejsze, CREPE wymaga GPU/CPU dla szybkiego działania.
- Odporność na akompaniament: CREPE > pYIN > klasyczne (w większości warunków).
- Interpretowalność: klasyczne i pYIN dają łatwiej interpretowalne trajektorie i miary pewności.

13. Preprocessing i jakość danych

13.1. Parametry akwizycji

- Format: WAV PCM 16-bit
- Częstotliwość próbkowania: 44.1 kHz (preferowane) lub 16 kHz dla ograniczonych zasobów
- Dynamika: minimalizacja klippingu, stabilne warunki nagrania

13.2. Filtracja i normalizacja

Zalecane: filtr dolnoprzepustowy 80 Hz i górnoprzepustowy 5000 Hz w celu redukcji szumów i nieistotnych składowych. Normalizacja RMS do ustalonego poziomu ułatwia porównania między nagraniami.

13.3. Zarządzanie metadanymi

Każde nagranie powinno mieć powiązany plik JSON z metadanymi: `id`, `timestamp`, `participant_code`, `sr`, `device`, `environment_notes`, `song_id`, `take_number`.

14. Plan analizy danych i wizualizacje

14.1. Przykładowe wykresy

- Trajektoria F0 (czas vs Hz) dla różnych metod na jednym wykresie.
- Błąd (est - ref) histogram i gęstość KDE.
- Boxplot RMSE per metoda.
- Wykres accuracy vs threshold centów.

14.2. Tabele wyników

- Tabela agregowana: metoda | RMSE mean | RMSE std | Accuracy@50c | Liczba ramek
- Szczegółowe CSV per nagranie: time, f0_ref, f0_py, f0_crepe, confidence_crepe


15. (USUNIĘTE) — Kwestionariusze i formularze zgody

Sekcja dotycząca formularzy zgody i kwestionariuszy została usunięta z dokumentu głównego, ponieważ niniejsza praca inżynierska nie przewiduje badań z udziałem ludzi. Wszelkie odwołania do ankiet zastąpiono opisem ewaluacji technicznej na publicznych i syntetycznych danych.

16. Harmonogram i ramowy plan pracy

- Tydzień 1–2: Uporządkowanie literatury, uzupełnienie bibliografii.
- Tydzień 3–4: Przygotowanie materiałów eksperymentalnych, szablonów i notatników demonstracyjnych.
- Tydzień 5–8: Zbieranie danych (przez autora), uruchomienie eksperymentów i przekazanie wyników.
- Tydzień 9–10: Analiza danych, wykresy, pisanie rozdziału Wyniki i Dyskusja.

17. Lista ilustracji i opis rysunków (szczegóły do dostarczenia)

- Rys.1: Schemat pipeline (blokowy) z opisem każdego modułu.
- Rys.2: Przykładowa trajektoria F0 — porównanie pYIN i CREPE.
- Rys.3: Boxplot RMSE dla wszystkich metod.
- Rys.4: UI mockup (statyczny) pokazujący wizualizację pitch i scoring.

<< zrzut ekranu: diagram pipeline (draw.io/export) — figures/diagram_pipeline_drawio.png >>
<< zrzut ekranu: fragment notebooka z wykresem trajektorii F0 (Jupyter output) — figures/notebook_f0_trajectory.png >>
<< zdjęcie uczestnika (anonimizowany placeholder) — images/placeholder_participant.jpg >>

18. Załącznik A — przykładowy format CSV wyników

Kolumny: `time`, `f0_ref`, `f0_py`, `f0_crepe`, `confidence_crepe`, `frame_valid`

19. Załącznik B — przykładowy formularz zgody

Tekst formularza (pełny) zostanie dodany jako osobny dokument, ale powinna się w nim znaleźć informacja o celu, sposobie obróbki danych, dobierowolności i kontakcie do prowadzącego badanie.

20. Uwagi końcowe

Po otrzymaniu rzeczywistych wyników eksperymentów od autora: wstawię kompletne tabele, wykresy i przeprowadzę szczegółową analizę statystyczną oraz sformułuję końcowe wnioski i rekomendacje.


4.5. Pseudokod pipeline eksperymentalnego przetwarzania

Pseudokod opisuje sekwencję kroków używaną w eksperymentach porównawczych:

1. Dla każdego pliku audio w zestawie testowym:
   a. Wczytaj plik (WAV) i znormalizuj RMS.
   b. Opcjonalnie: przeprowadź separację źródeł (vocal, accompaniment).
   c. Oblicz estymację F0 metodą pYIN (librosa.yin) z parametrami: frame_length=2048, hop_length=256.
   d. Oblicz estymację F0 metodą CREPE (jeśli dostępna) z step_size=10 ms i ewentualnym Viterbi smoothing.
   e. Wyrównaj trajektorie czasowo (synchronizacja ramek) i zapisz wyniki do CSV: time, f0_ref (jeśli dostępne), f0_py, f0_crepe, confidence_crepe.
   f. Oblicz metryki (RMSE, accuracy w progu centów) i zapisz aggregowane wyniki.

Pseudokod (schematyczny):

```text
for file in dataset:
	y, sr = load_wav(file)
	y = normalize_rms(y)
	if do_separation:
		vocal = separate_vocal(y)
	else:
		vocal = y
	f0_py = yin(vocal, params)
	f0_crepe = crepe_predict(file, params)  # jeśli dostępne
	synced = align_frames(f0_py, f0_crepe)
	save_csv(file+'_results.csv', synced)
	compute_metrics(synced)
end
```

4.6. Przykładowe polecenia i uruchomienie (PowerShell)

Instalacja zależności (zalecane środowisko wirtualne):

```
python -m pip install --upgrade pip
python -m pip install librosa soundfile numpy matplotlib pandas
# opcjonalnie: python -m pip install crepe
```

Uruchomienie demonstracyjnego notebooka (w VS Code lub Jupyter):

```
jupyter notebook pitch_detection_demo.ipynb
```

Uruchomienie skryptu batch (przykład):

```
python run_batch_analysis.py --input_folder data/test --output_folder results --use_separation
```

Wyniki zapisuj do `results/*.csv`, a następnie użyj skryptu `aggregate_results.py` do wygenerowania tabel i wykresów.

---

**Rozwinięte rozdziały (nie wymagające aplikacji)**

Aby praca była kompletna niezależnie od implementacji aplikacji, poniższe rozdziały rozwinięto szczegółowo — zawierają rekomendowane parametry, procedury analityczne i szablony plików.

**2. Przegląd literatury — rozszerzenie**
- Kategorie i kluczowe wnioski:
	- Metody klasyczne (autokorelacja, cepstrum, YIN): szybkie, interpretable, dobre w warunkach monofonicznych; słabe przy akompaniamencie.
	- Metody probabilistyczne (pYIN): stabilne trajektorie F0, estymacja niepewności, użyteczne do analizy śpiewu solo.
	- Metody głębokiego uczenia (CREPE i warianty): dobre uogólnienie w warunkach akompaniamentu i szumów; wymagają danych treningowych.
	- Separacja źródeł: wpływ na jakość detekcji pitch — poprawia SNR wokalu, ale wprowadza artefakty; wymaga empirycznej oceny wpływu na F0.
	- Metodologie ewaluacji: konieczność stosowania zarówno metryk obiektywnych (RMSE, accuracy@cent) jak i subiektywnych (ankiety, oceny ekspertów).
- Luki w literaturze i rekomendacje: brakuje badań systematycznie porównujących wpływ różnych metod separacji na estymację pitch śpiewanego głosu; rekomendowane porównanie pYIN vs CREPE na zbiorze z kontrolowanym akompaniamentem.

**4. Metodologia — rozszerzenie szczegółowe**
- Pipeline (dokładne kroki):
	1. Standardizacja plików: konwersja do WAV PCM16, `sr=44100`, kanał mono (mixdown), RMS-normalizacja do -20 dBFS.
	2. (Opcjonalnie) Separacja: uruchomić `open-unmix` lub `spleeter` -> zapisać `vocal.wav` i `accompaniment.wav`.
	3. Filtracja pasmowa: 80–5000 Hz (opcjonalnie) w celu redukcji niskoczęstotliwościowych artefaktów.
	4. Estymacja F0:
		 - pYIN (librosa/pYIN): `frame_length=2048`, `hop_length=256`, zakres F0: C2–C7 (ok. 65–2093 Hz), wygładzanie trajektorii i minimalny czas trwania nuty = 50 ms.
		 - CREPE: użyć pre-trained model; `step_size=10 ms`, zastosować Viterbi smoothing (jeśli dostępne) i threshold confidence (np. 0.5) do filtrowania niepewnych ramek.
	5. Synchronizacja ramek i interpolacja braków: użyć timestampów (~hop_length/sr) i oznaczyć `frame_valid=false` dla ramek poniżej progu pewności.
	6. Agregacja wyników per nagranie i kalkulacja metryk.
- Obsługa przypadków brzegowych: detekcja voiceless segments, automatyczne wykrywanie clippingu, logowanie jakości sygnału.
- Parametry do podania w metadanych eksperymentu: `sr, frame_length, hop_length, fmin, fmax, separation_used, separation_model_version`.

**5. Protokół eksperymentu — rozszerzenie operacyjne**
- Projekt badania: plan within-subject (każdy uczestnik testuje wszystkie warunki), z losową kolejnością piosenek/fragmentów aby zminimalizować efekt porządku.
- Kalibracja przed testem: test nagrania kontrolnego (skala) w celu ustawienia poziomu nagrania i wykrycia problemów sprzętowych.
- Procedura testowa:
	- Instrukcja i formularz zgody.
	- Krótkie ćwiczenie/rozgrzewka (2–3 próbki). 
	- Bloki testowe: kontrolne (bez feedbacku), z feedbackiem offline (zapisane wyniki), ewentualnie z interaktywnym feedbackiem (jeżeli dostępne).
	- Po każdym bloku: kwestionariusz oceniający czytelność i przydatność feedbacku.
- Zapewnienie kontroli eksperymentalnej: stałe odległości mikrofonu, wygłuszenie tła, zapis warunków w metadanych.
- Wielkość próby i estymacja mocy: przy założonym efekcie średnim (Cohen's d ~ 0.6) i poziomie alfa 0.05, dla mocy 0.8 sugerowana N ≈ 24 (do potwierdzenia po wstępnych danych).

**6. Materiały i dane — formaty i strukturacja**
- Struktura katalogów (zalecana):
	- `data/raw/` — surowe nagrania WAV
	- `data/processed/` — separated vocals, preprocessed audio
	- `results/per_record/` — CSV per nagranie
	- `results/aggregated/` — tabele zbiorcze
	- `figures/` — wygenerowane wykresy
- Metadane (JSON) — przykładowy schemat dla nagrania:

```json
{
	"id": "P001_take1",
	"participant_code": "P001",
	"sr": 44100,
	"device": "Zoom H4n",
	"environment": "roomsilent",
	"song_id": "SongA",
	"take_number": 1
}
```

- Checklista jakości pliku: długość min 3s, brak clipingu (> -0.5 dBFS), SNR > 20 dB (jeżeli możliwe).

**7. Metryki i analiza — dokładne definicje**
- RMSE (Hz): już podany wzór; raportować także medianę błędu i IQR.
- Błąd w centach:
	$$error_{cents} = 1200 \log_2\frac{f_{0}^{est}}{f_{0}^{ref}}$$
- Accuracy@T cents: udział ramek, gdzie |error_cents| ≤ T (np. T=50 centów).
- Voicing metrics: Voicing Recall (VR), Voicing False Alarm (VFA) względem referencji (jeżeli dostępna). 
- Confidence calibration: analiza relacji między wartością `confidence` a rzeczywistym błędem (calibration curve, reliability diagram).
- Testy statystyczne: dla porównań par metod użyć testów zależnych (paired t-test lub Wilcoxon), wielokrotne porównania — korekta Bonferroniego lub FDR.

**8. Reproducibility — skrypty i wymagania**
- Minimalny `requirements.txt` (przykład):

```
numpy
scipy
librosa
pandas
matplotlib
soundfile
crepe  # opcjonalnie
```

- Przykładowe komendy do wygenerowania wyników:

```powershell
python scripts/run_analysis.py --input data/raw --output results/per_record --use_separation
python scripts/aggregate_results.py --input results/per_record --output results/aggregated/aggregated_results.csv
python scripts/plot_results.py --input results/aggregated/aggregated_results.csv --out figures/
```

- Dołączyć plik `README_results.md` z opisem kroków, wersji modeli i parametrów eksperymentu.

**9. Załączniki operacyjne**
- Szablon kwestionariusza (CSV) — kolumny: `participant_code,block,question_id,response,comment`
- Szablon formularza zgody — tekst do druku (w załączniku osobnym).
- Pseudokod (dokładny) kroków analizy (może być użyty jako `scripts/run_analysis.py`):

```
for record in data/raw:
		convert_to_wav(record)
		normalize_rms(record)
		if do_separation:
				vocal = separate(record)
		else:
				vocal = record
		f0_py = run_pyin(vocal, params)
		f0_crepe = run_crepe(vocal, params)
		aligned = align_frames(f0_py, f0_crepe)
		save_csv(aligned, results/per_record)
end
aggregate_results(results/per_record) -> results/aggregated
plot_and_export_figures(results/aggregated, figures)
```

---

Materiały i opisy powyższe można dalej rozbić na podsekcje docelowe (np. szczegółowe instrukcje akwizycji, checklisty) — powiedz, które rozdziały chcesz, żebym rozwinął jeszcze bardziej (np. pełny tekst formularza zgody, szczegółowy szablon CSV kwestionariusza, kompletne skrypty Python). 

---

**Szczegółowe rozszerzenia (surowy, rozbudowany tekst)**

Poniżej znajduje się obszerna wersja rozdziałów, które nie wymagają dostarczenia aplikacji ani danych eksperymentalnych. Tekst jest przygotowany jako surowy materiał do dalszego redagowania — rozdziały są konkretne, techniczne i zawierają gotowe fragmenty do wklejenia do pracy.

1) Rozszerzenie: Metody klasyczne estymacji F0

Metody klasyczne do estymacji częstotliwości podstawowej (F0) stanowią fundament analizy sygnału dźwiękowego i pozostają użyteczne ze względu na swoją niską złożoność obliczeniową oraz interpretable charakter wyników. Poniżej opisano trzy szeroko stosowane podejścia: autokorelacja, cepstrum i algorytm YIN.

- Autokorelacja: Metoda opiera się na obliczeniu korelacji sygnału z wersją przesuniętą o opóźnienie τ. Maksima funkcji autokorelacji odpowiadają okresom sygnału. W implementacjach praktycznych stosuje się okno analityczne o długości W i normalizację w celu ograniczenia wpływu energii sygnału.

- Cepstrum: Procedura polega na obliczeniu logarytmu wartości widma sygnału i wykonaniu odwrotnej transformacji Fouriera, co pozwala wyodrębnić składowe periodyczne jako piki w domenie cepstralnej. Pozycja piku odpowiada odwrotności F0.

- Algorytm YIN: YIN używa funkcji różnicowej zamiast autokorelacji, co zmniejsza wpływ składowych harmonicznych. Kluczowe kroki to: obliczenie funkcji różnicowej d(τ), normalizacja tej funkcji, wybór lokalnego minima i interpolacja w celu dokładnej estymacji okresu. YIN charakteryzuje się dobrymi właściwościami detekcji dla tonów prostych oraz niską tendencją do halucynacji harmonicznych.

Implementacja w praktyce: fragment kodu pokazujący, jak użyć `librosa` do obliczenia YIN i podstawowych filtrów preprocesingowych umieszczono wcześniej; zalecane parametry to `frame_length=2048` i `hop_length=256`, zakres f0 zgodny z rejestrami głosu męskiego i żeńskiego (C2–C7).

2) Rozszerzenie: pYIN i modele probabilistyczne

pYIN rozszerza YIN przez wprowadzenie modelu probabilistycznego do śledzenia trajektorii F0 i estymacji niepewności. Zamiast zwracać pojedynczą wartość F0 dla ramki, pYIN może generować rozkład prawdopodobieństwa nad kandydatami częstotliwości, który może zostać przetworzony przez algorytm śledzący (np. Viterbi) w celu uzyskania spójnej trajektorii.

Zalety pYIN:
- Estymacja niepewności: przydatna przy wyznaczaniu thresholdów oraz oznaczaniu ramek `frame_valid=false`.
- Lepsza stabilność trajektorii: wygładzenie i model czasowy minimalizują skoki spowodowane krótkotrwałymi artefaktami.

Ograniczenia:
- Ograniczona odporność na silny akompaniament bez uprzedniej separacji źródeł.

3) Rozszerzenie: Sieci konwolucyjne — CREPE i warianty

CREPE i podobne metody uczące się bezpośrednio mapują okna sygnału (lub widma) na rozkład prawdopodobieństwa dla dyskretnych binów częstotliwości. Stosuje się konwolucyjne warstwy, warstwy normalizujące i mechanizmy wygładzania. Modele te często przewyższają metody klasyczne w warunkach akompaniamentu i są mniej wrażliwe na szumy o szerokim paśmie.

W praktyce: CREPE ma różne warianty ze względu na rozdzielczość częstotliwości (np. 512-bin), a wyniki można poprawić poprzez augmentację danych, fine-tuning na konkretnych nagraniach śpiewu oraz zastosowanie viterbi smoothing.

4) Rozszerzenie: Separacja źródeł — wpływ na estymację pitch

Separacja wokal/akompaniament zwiększa stosunek sygnału do szumu (SNR) wokalu i może poprawić działanie estymatorów F0. Jednakże metody separacji wprowadzają własne artefakty (kliknięcia, „bleeding” instrumentów), które mogą wpływać na wyniki detekcji. Dlatego empiryczne oceny powinny porównywać wyniki dla trybu „raw” vs „separated”, oraz uwzględniać jakość separacji w metadanych.

Przykładowe narzędzia: Spleeter (łatwa integracja), Open-Unmix (badawczo-odporny), Demucs (głębokie podejście). W raporcie należy opisać wersję modelu, hiperparametry oraz sposób zastosowania (offline vs real-time).

5) Rozszerzenie: Dane i akwizycja — szczegółowy protokół

- Sprzęt: rekomendowane mikrofony (kondensatorowe studyjne) oraz urządzenia przenośne (Zoom H4n, Tascam) — opisać różnice i wpływ na SNR.
- Ustawienia: odległość od mikrofonu ~20–30 cm, kąt 0–30 stopni względem osi mikrofonu; poziom nagrania testowy (RMS) celowo ustawiony na -20 dBFS.
- Środowisko: opisanie wymogów akustycznych (tłumienie pogłosu, minimalizacja tła), wzorzec nagrań kontrolnych.
- Metadane: szczegółowy schemat JSON dla każdego pliku (patrz wcześniej) oraz pole `quality_checks` z wartościami SNR i clipping flag.

6) Rozszerzenie: Statystyka i analiza wyników — szczegóły operacyjne

- Hipotezy: sformułowanie H0 i H1 dla każdego porównania (np. H0: średni RMSE pYIN = CREPE).
- Estymacja mocy: przykład obliczenia wymaganego N dla oczekiwanego efektu.
- Testy: why choose paired tests, jak obsługiwać brakujące dane (imputacja vs analiza ramek ważnych).
- Wizualizacje: wykresy rozrzutu error vs confidence, boxploty, Bland-Altman plots dla porównań metod.

7) Rozszerzenie: Metryki i diagnostyka jakości

- Szczegółowe definiowanie metryk: RMSE, median error, IQR, accuracy@T, VR, VFA.
- Calibration: jak wygenerować calibration curve i reliability diagram dla confidence scores.
- Diagnostyka: identyfikacja outlierów, analiza przypadków błędnych detekcji (case studies) oraz propozycja automatycznych filtrów jakościowych.

8) Rozszerzenie: Etyka, prywatność i formularz zgody — szkic treści

Treść formularza zgody powinna zawierać: cel badania, rodzaj zbieranych danych, sposób anonimizacji, prawa uczestnika, kontakt do promotora, czas przechowywania danych i zakres planowanej publikacji. Dodatkowo należy dodać sekcję zgody na użycie fragmentów nagrań w materiałach dydaktycznych (opcjonalne).

9) Rozszerzenie: Reproducibility i zarządzanie kodem

- Struktura repozytorium: `data/`, `scripts/`, `results/`, `notebooks/`, `docs/`.
- Środowisko: `requirements.txt` i przykładowy `Dockerfile` (możliwe wykorzystanie obrazu `python:3.11-slim`).
- Testy jednostkowe: małe testy poprawności parsowania CSV i alignmentu ramek.

10) Plan pracy (co dalej napisać i dopisać — szczegółowy roadmap)
- Kompletny tekst formularza zgody (plik `forms/consent_form.md`).
- Pełny szablon kwestionariusza i przykładowe odpowiedzi (CSV). 
- Rozbudowane case studies: analiza 6–8 przykładowych nagrań z ilustracjami i komentarzami.
- Pełne skrypty `scripts/run_analysis.py`, `scripts/aggregate_results.py`, `scripts/plot_results.py` oraz `README_results.md`.
- Appendiksy: pseudokod, pełne fragmenty notebooków z wykresami demonstracyjnymi i przykładowymi danymi syntetycznymi.

---

**Pełna metodologia techniczna — implementacja i parametry**

Poniższa sekcja zawiera kompletny, techniczny opis parametrów eksperymentu, rekomendowane implementacje, strategie pomiaru i procedury mające zapewnić powtarzalność wyników. Treść ma charakter praktyczny — można ją skopiować do `methods` w repozytorium i użyć jako specyfikacji inżynierskiej.

1. Środowisko uruchomieniowe i wymagania

- System: Linux / Windows 10+; do pomiarów wydajności zalecany Linux (łatwiejsze profilowanie). 
- CPU: min. 4 rdzenie (benchmarky wykonane na 8 rdzeniach dają wiarygodne pomiary); opcjonalnie GPU (NVIDIA CUDA) dla przyspieszenia inferencji CREPE/ONNX.
- Pamięć: min. 8 GB RAM; jeśli używa się Demucs/htdemucs zalecane 16+ GB.
- Python: 3.10–3.11 (wirtualne środowisko), rekomendowane biblioteki w `requirements.txt`.

2. Preprocessing — szczegółowe kroki i parametry

- Konwersja: wszystkie pliki wejściowe konwertować do WAV PCM16, `sr=44100`, mono. Dla skryptów pomiarowych dopuszczalny 16 kHz (ułatwia porównania ze środowiskiem audio serwera).
- Normalizacja: RMS-normalizacja do -20 dBFS lub znormalizowanie do peak -1 dB przy zachowaniu dynamiki; logowanie wartości RMS przed i po.
- Filtracja pasmowa: zalecany filtr pasmowy 80–5000 Hz (FIR, okno Hamming, rząd 512) — podaje się implementację i parametry filtracji w metadanych.
- VAD (Voice Activity Detection): prosty detektor energii + cepstralny heurystyczny detektor; ramki z poziomem poniżej -40 dBFS oznaczać jako niemówione i oznaczać `frame_valid=false`.

3. Parametry STFT / okna

- `frame_length=2048`, `hop_length=256` — rozdzielczość czasowo-częstotliwościowa dostosowana do analizy wokalu. Okno Hanninga.
- Do metod opartych na CREPE stosować `step_size=10 ms` przy predykcji; dla pYIN użyć parametrów zgodnych z implementacją `librosa`.

4. Estymacja F0 — ustawienia i postprocessing

- pYIN (librosa): `fmin=librosa.note_to_hz('C2')`, `fmax=librosa.note_to_hz('C7')`, minimal duration=50 ms; wynik uzupełnić o probabilistyczne score (jeżeli implementacja zwraca confidence).
- CREPE: używać pre-trained modelu (np. 512-bin); zastosować Viterbi smoothing na wyjściu; filtrować ramki o `confidence < 0.5` (konfigurowalny próg).
- Interpolacja: brakujące wartości F0 (np. w voiceless segments) w analizie błędów traktować osobno — nie imputować dla RMSE (liczyć tylko na ramek ważnych) lub raportować również metryki globalne z imputacją zerową.

5. Separacja źródeł — ustawienia i porównania

- Demucs: `mdx_extra_q` dla `stems=2`, `htdemucs` dla `stems=4`. Logować wersję modelu i czas wykonania separacji dla każdej ścieżki.
- Porównania: dla tej pracy zestawić wyniki F0 na trzech wariantach danych: `raw_mix`, `separated_vocal`, `separated_vocal_denoised` (opcjonalna filtracja po separacji).

6. Metody porównawcze i metryki szczegółowo

- RMSE (Hz) i RMSE (cents) — raportować obie wersje.
- Accuracy@T cents — raportować dla T = 25, 50, 100 centów.
- Voicing Recall, Voicing False Alarm — względem referencji, jeśli dostępna.
- Confidence calibration: wykres reliability diagram i mean absolute error per confidence bin.

7. Procedura pomiaru wydajności (latency/CPU)

- Metryki: czas przetworzenia (s) per 10 s audio, CPU utilization (%), pamięć RSS (MB), jeżeli dostępne GPU — percent GPU utilization i GPU memory.
- Scenariusze: (A) server-side CREPE (torchcrepe) na 16 kHz resampled audio; (B) client-side crepe-wasm (symulacja lokalna) lub crepe-onnx inferencja. Dla obu mierzyć end-to-end latency od chwili dostarczenia pliku/ramki do momentu otrzymania predykcji.
- Narzędzia: `time`, `psutil` (w skrypcie), `nvidia-smi` dla GPU.

8. Logowanie i metadane

- Każdy eksperyment zapisuje `manifest.json` z polami: `experiment_id, date, host, cpu_info, gpu_info (opt.), python_env_hash, git_commit, data_versions, separation_model, pitch_model, processing_steps`.
- Wyniki per nagranie: CSV z kolumnami: `time,f0_ref,f0_py,f0_crepe,confidence_crepe,frame_valid,processing_id`.

9. Reproducibility — środowisko i Docker

- `requirements.txt` zawiera dokładne wersje bibliotek; zalecane lockowanie środowiska (`pip-compile` lub `pip freeze`).
- Przykładowy `Dockerfile` (Appendix) ułatwia odtwarzanie środowiska na serwerze badawczym.

10. Analiza statystyczna — szczegółowy plan

- Eksperymenty porównań metod traktować jako powtarzające się pomiary na tych samych próbkach — stosować testy zależne (paired t-test) lub nieparametryczne Wilcoxon, raportować wielkość efektu (Cohen's d) oraz przedziały ufności.
- Dla wielokrotnych porównań stosować korektę FDR (Benjamini-Hochberg).

---

**Appendix A — przykładowy Dockerfile i konfiguracja**

Przykładowy `Dockerfile` dla środowiska analitycznego (Python 3.11):

```
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY scripts/ scripts/
COPY data/ data/
CMD ["python", "scripts/run_analysis.py", "--input", "data/raw", "--output", "results/per_record"]
```

W `README_results.md` zamieszczone są komendy uruchomieniowe i opis parametrów (plik zostanie dodany do repozytorium wraz ze skryptami w katalogu `scripts/`).

---

**Appendix B — szkielet skryptów (opis)**

- `scripts/run_analysis.py` — skrypt batch wykonujący preprocessing, (opcjonalnie) separację, estymację pYIN/CREPE, zapisy per_record CSV.
- `scripts/aggregate_results.py` — agreguje wyniki per_record do `aggregated_results.csv` i liczy metryki podstawowe.
- `scripts/plot_results.py` — generuje wykresy: boxplot RMSE, przykładowe trajektorie F0, calibration curves.

W katalogu `scripts/` znajdą się szablony skryptów pozwalające uruchomić cały pipeline w środowisku lokalnym lub w kontenerze.

---

Po wykonaniu tych rozszerzeń mogę przejść do wygenerowania konkretnych plików w `scripts/` (`run_analysis.py`, `aggregate_results.py`, `plot_results.py`), `requirements.txt` oraz `README_results.md`. Potwierdź, czy mam je dodać teraz — wówczas utworzę pliki i wstawię krótkie instrukcje uruchomienia.

---

Powiedz, które z powyższych podpunktów chcesz, żebym rozwinął teraz jako pełne teksty (np. pełny formularz zgody + CSV kwestionariusza oraz 6 case studies), a które zostawić na później — zabiorę się od razu za wskazane elementy i zaktualizuję `TODO` oraz pliki w repozytorium.

---

**Appendix C — Rozszerzenie materiałów technicznych (dodatkowe rozdziały)**

Poniżej wstawiono rozszerzone materiały techniczne przygotowane w oddzielnym pliku roboczym. Materiały te można traktować jako kompletne rozszerzenie do rozdziałów: Przegląd literatury, Metodologia, Metryki i Załączniki techniczne. Można je pozostawić jako osobny appendix lub zintegrować z istniejącymi rozdziałami.

1. Rozszerzony przegląd literatury

- Autokorelacja i metody czasowo-częstotliwościowe: Omówienie klasycznych metod estymacji tonu opartych na autokorelacji, ich zalet i ograniczeń przy obecności harmonicznych i hałasu. Zestawienie z metodami spektralnymi (cepstrum, harmonic product spectrum) i implikacje dla precyzji w niskich częstotliwościach.

- YIN i pYIN: Szczegółowy opis algorytmu YIN — funkcja różnicowa, normalizacja i wybór kandydata fundamentalnego. Rozszerzenie na pYIN: probabilistyczne modelowanie kandydata, voicing decision i integracja z HMM/CRF dla wygładzania trajektorii. Dyskusja implementacyjna: próg voicing, okna analizy, overlap.

- Modelowe metody oparte na sieciach neuronowych (CREPE i pochodne): Architektura CREPE (konwolucyjne filtry nad sygnałem surowym), sposoby trenowania, strategie augmentacji danych (pitch-shifting, additive noise), i wpływ rozmiaru okna na rozdzielczość czasową. Omówienie konwersji modeli do ONNX/ONNX Runtime dla szybkości inference oraz dostępnych wariantów typu CREPE-tiny.

- Separacja źródeł (Demucs, Spleeter, Open-Unmix): Porównanie architektur (U-Net, Wave-U-Net, ResUNet) i konsekwencje dla algorytmów pitch-tracking (pozostałości wokalu, artefakty). Dyskusja o doborze modelu separacyjnego do eksperymentów porównawczych — kompromis między jakością separacji a tym, jak artefakty wpływają na pomiar pitch.

- Benchmarki i wcześniejsze prace porównawcze: Przegląd datasetów (MIREX, MDB-stem, iKala, MIR-1K), metody oceny i jak wcześniejsze prace raportują RMSE, Voicing Recall/Fallacy, Accuracy@T cents. Wskazanie luk badawczych — niewiele prac raportuje pełną kalibrację niepewności modelu.

2. Rozbudowana metodologia — implementacyjne detale

- Preprocessing: Standard: resampling do 44.1 kHz (lub 16 kHz tam gdzie wymagane przez model), normalizacja RMS, usuwanie DC. Rekomendowane parametry STFT: n_fft=2048, hop_length=256 (równoważne ~5.8 ms przy 44.1 kHz), window=Hann. Rekomendacje alternatywne dla niskich tonów: n_fft=4096 aby uzyskać lepszą rozdzielczość częstotliwościową.

- Filtry i augmentacje: Pasmo przepustowe 50 Hz–12 kHz; wysokoprzepustowy filtr o nachyleniu 6 dB/oct przy 50 Hz, jeśli nagrania zawierają silne składowe niskoczęstotliwościowe. Augmentacje stosowane przy tworzeniu datasetu syntetycznego: zmiana wysokości +/− 2 semitonów, dodanie szumów Gaussowskich, kompresja MP3 na różnych bitrate'ach.

- Parametry algorytmów: pYIN: frame_length odpowiadający `n_fft`, minF0=50 Hz, maxF0=2000 Hz (dla śpiewu możliwe zawężenie do 60–1000 Hz), voiced/unvoiced threshold ustawiony eksperymentalnie (0.1–0.3). CREPE: okno 1024ms (domyślnie 1024 próbki u 16kHz), stride 10 ms — opisać wpływ na latencję i rozdzielczość.

- Metoda porównań: Porównania wykonywane na zestawach: (A) czyste wokale (ground truth f0), (B) miksy syntetyczne (wokal + instrumental), (C) miksy po separacji źródeł. Dla każdego przypadku raport: RMSE(Hz), RMSE(cents), Accuracy@T (T = 10, 25, 50 cents), Voicing Recall, Voicing False Alarm.

3. Metryki i analiza błędów — szczegóły

- RMSE (Hz): RMSE = sqrt(mean((f_est - f_ref)^2)) — wrażliwe na zakres częstotliwości; uzupełnienie przez RMSE w centach: cents = 1200 * log2(f_est / f_ref).

- Accuracy@T cents: Procent obliczeń, gdzie |cents(f_est,f_ref)| ≤ T.

- Voicing metrics: Voicing Recall = TP_voiced / (TP_voiced + FN_voiced); Voicing False Alarm = FP_voiced / (FP_voiced + TN_voiced).

- Kalibracja niepewności: Jeśli model dostarcza score/confidence, ocenić Brier score oraz krzywe kalibracji (reliability diagrams) w przedziałach confidence-bins.

- Statystyki porównań: Paired tests (Wilcoxon signed-rank) dla nieregresywnych rozkładów; efekt size: Cohen's d; korekta wielokrotnych porównań: Benjamini–Hochberg (FDR).

4. Propozycje rozdziałów wyników i tabel

- Schemat sekcji wyników:
	- Tabela 1: Zestawienie RMSE i Accuracy@T dla metod na czystych wokalach.
	- Tabela 2: Wyniki na syntetycznych miksach (różne SNR i typy instrumentów).
	- Tabela 3: Wpływ separacji źródeł (porównanie bez separacji / po separacji).
	- Rysunek 1: Boxplot RMSE(cents) dla wszystkich metod.
	- Rysunek 2: Reliability diagrams dla modeli dających confidence.

5. Dyskusja i interpretacja wyników

- Wskazać praktyczne implikacje różnic RMSE w centach (np. 50 cents to pół tonu — subiektywnie duża różnica). Porównać, które metody lepiej utrzymują spójność w obecności instrumentów o gęstych harmonicznych.

- Omówienie limitów eksperymentu: syntetyczne miksy nie oddają w pełni realnych artefaktów nagrań live; modele separacyjne wprowadzają specyficzne artefakty, które mogą fałszować estymację f0.

6. Załączniki techniczne (do dołączenia jako appendiks)

- Pseudokod pYIN, CREPE inference pipeline: Dokładne kroki, obsługa brakujących ramek, interpolacja trajektorii.

- Przykładowe formaty plików wynikowych: CSV per-record: columns = [record_id, time_s, f0_ref, f0_est_crepe, f0_est_pyin, voicing_ref, voicing_est_crepe, confidence_crepe, ...].

- Przykładowe skrypty CLI (wywołania):
	- `python scripts/run_analysis.py --input data/wavs --out results/per_record`
	- `python scripts/aggregate_results.py --in results/per_record --out results/aggregated/summary.csv`

7. Krótkie wzmianki metodologiczne do włączenia w finalnym rozdziale

- Walidacja reproducibility: zapisać seed, wersje pakietów (w `requirements.txt`), commit hash kodu, i snapshot modeli (weigths+config). Zawrzeć przykładowy `Dockerfile` do reproducibility (już opisany w `Praca_dyplomowa.md`).

- Plan publikacji wyników: tabelaryczny raport wraz z CSV i skryptami, aby czytelnik mógł odtworzyć metryki.

---

Koniec Appendix C. Jeśli chcesz, mogę teraz: (1) wypchnąć te sekcje do `Praca_dyplomowa.md` (zrobione), (2) wygenerować kompletne pliki skryptów (`scripts/`) i `requirements.txt`, albo (3) rozwinąć konkretne elementy Appendix (np. pełny formularz zgody lub kompletny pseudokod). Wskaż następną akcję.

---

Appendix D — Pełne rozszerzenie materiałów (z `Praca_dyplomowa_expansion.md`)

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

Plik pełnego rozszerzenia został dołączony jako Appendix D w celu zwiększenia objętości roboczej wersji pracy (można później przeredagować i zintegrować treści w rozdziałach). Jeśli chcesz, przejdę teraz do jednego z następujących kroków:
- (1) Przeredagowanie i scalanie sekcji (usunięcie duplikatów),
- (2) Generowanie pełnych skryptów w `scripts/` i `requirements.txt`,
- (3) Rozwinięcie konkretnych załączników (formularz zgody, szablon kwestionariusza, case studies).
