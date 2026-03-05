README — Results pipeline

Cel
----
Ten dokument opisuje sposób uruchomienia skryptów analitycznych generujących wyniki opisane w rozdziale Wyniki pracy dyplomowej. Skrypty umieszczone są w katalogu `scripts/`.

Wymagania
---------
1. Utwórz i aktywuj środowisko wirtualne Python 3.10/3.11

```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
```

2. Zainstaluj zależności:

```bash
pip install -r requirements.txt
```

Uruchomienie pipeline
---------------------
1. Preprocessing + analiza per plik:

```bash
python scripts/run_analysis.py --input data/raw --output results/per_record --use_separation
```

2. Agregacja wyników:

```bash
python scripts/aggregate_results.py --input results/per_record --output results/aggregated/aggregated_results.csv
```

3. Generowanie wykresów:

```bash
python scripts/plot_results.py --input results/aggregated/aggregated_results.csv --out figures/
```

Pliki wyjściowe
----------------
- `results/per_record/<id>_results.csv` — pliki per nagranie
- `results/aggregated/aggregated_results.csv` — tabela zbiorcza z metrykami
- `figures/` — wykresy do wstawienia do pracy

Notatki
-------
- Jeśli używasz `crepe`, upewnij się, że masz zainstalowany `torch` zgodny z wersją GPU/CPU.
- Skrypty zawierają opcjonalne wywołania do narzędzi separacji (Demucs). Demucs może wymagać dodatkowych zasobów i instalacji zależności.
- Dla odtworzenia eksperymentów używaj pliku `manifest.json` zapisywanego obok wyników, aby zachować wersje modeli i parametrów.
