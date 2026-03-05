# ??? Edytor Audio

Modu? Editor umo?liwia tworzenie i edycj? projektów audio z warstwami, efektami i eksportem.

---

## Przegl?d funkcji

| Funkcja | Opis |
|---------|------|
| **Projekty** | Zarz?dzanie projektami audio |
| **Sekcje** | Podzia? projektu na sekcje czasowe |
| **Warstwy** | Wielowarstwowe audio z miksowaniem |
| **Efekty** | Biblioteka efektów (reverb, EQ, etc.) |
| **Sample Packs** | Paczki sampli do wykorzystania |
| **Eksport** | Renderowanie do ró?nych formatów |
| **Wspó?praca** | Udost?pnianie projektów |

---

## Encje

### AudioProject

```
AudioProject
??? Id: int
??? Name: string
??? Description: string
??? OwnerId: int (UserProfile)
??? Bpm: decimal
??? TimeSignature: string (np. "4/4")
??? Duration: TimeSpan
??? Sections: ICollection<AudioSection>
??? CreatedAt / ModifiedAt: DateTime
??? IsPublic: bool
```

### AudioSection

```
AudioSection
??? Id: int
??? ProjectId: int
??? Name: string
??? StartTime: TimeSpan
??? Duration: TimeSpan
??? Color: string (hex)
??? SortOrder: int
??? Layers: ICollection<AudioLayer>
??? InputMappings: ICollection<AudioInputMapping>
```

### AudioLayer

```
AudioLayer
??? Id: int
??? SectionId: int
??? Name: string
??? Type: LayerType (Audio, MIDI, Vocal)
??? Volume: decimal (0-2, gdzie 1 = 100%)
??? Pan: decimal (-1 do 1)
??? Mute / Solo: bool
??? Color: string
??? AudioClipId: int?
??? Items: ICollection<AudioLayerItem>
??? Effects: ICollection<AudioLayerEffect>
```

### AudioLayerItem

```
AudioLayerItem
??? Id: int
??? LayerId: int
??? StartTime: TimeSpan
??? Duration: TimeSpan
??? SourceFileId: int (LibraryAudioFile)
??? SourceStartTime: TimeSpan (offset w pliku)
??? FadeIn / FadeOut: TimeSpan
??? Gain: decimal
??? SortOrder: int
```

### AudioClip

```
AudioClip
??? Id: int
??? Name: string
??? FilePath: string
??? Duration: TimeSpan
??? SampleRate: int
??? Channels: int
??? Tags: ICollection<AudioClipTag>
??? CreatedAt: DateTime
```

### AudioEffect

```
AudioEffect
??? Id: int
??? Name: string
??? Type: EffectType
??? DefaultParameters: string (JSON)
??? Description: string
```

### AudioLayerEffect

```
AudioLayerEffect
??? Id: int
??? LayerId: int
??? EffectId: int
??? Parameters: string (JSON)
??? IsEnabled: bool
??? Order: int
```

---

## Typy efektów

| Typ | Opis | Parametry |
|-----|------|-----------|
| `Reverb` | Pog?os | room_size, damping, wet_level |
| `Delay` | Opó?nienie | delay_time, feedback, mix |
| `EQ` | Korektor | low, mid, high, freq_low, freq_high |
| `Compressor` | Kompresor | threshold, ratio, attack, release |
| `Limiter` | Limiter | threshold, release |
| `Chorus` | Chorus | rate, depth, mix |
| `Distortion` | Zniekszta?cenie | drive, tone, mix |
| `Filter` | Filtr | type, cutoff, resonance |
| `Gain` | Wzmocnienie | gain_db |
| `Pan` | Panorama | position |

---

## Sample Packs

### AudioSamplePack

```
AudioSamplePack
??? Id: int
??? Name: string
??? Description: string
??? Category: string (Drums, Bass, Synth, etc.)
??? ImageUrl: string?
??? Samples: ICollection<AudioSample>
??? CreatedByUserId: int
??? IsPublic: bool
```

### AudioSample

```
AudioSample
??? Id: int
??? PackId: int
??? Name: string
??? FilePath: string
??? Duration: TimeSpan
??? Bpm: decimal?
??? Key: string? (np. "C#m")
??? Category: string
??? Tags: string (JSON array)
```

---

## API Endpoints

### Projekty

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/editor/projects` | Lista projektów |
| `GET` | `/api/editor/projects/{id}` | Szczegó?y projektu |
| `POST` | `/api/editor/projects` | Utwórz projekt |
| `PUT` | `/api/editor/projects/{id}` | Aktualizuj |
| `DELETE` | `/api/editor/projects/{id}` | Usu? |
| `POST` | `/api/editor/projects/{id}/duplicate` | Duplikuj |

### Sekcje

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/editor/projects/{id}/sections` | Lista sekcji |
| `POST` | `/api/editor/projects/{id}/sections` | Dodaj sekcj? |
| `PUT` | `/api/editor/sections/{id}` | Edytuj |
| `DELETE` | `/api/editor/sections/{id}` | Usu? |
| `PUT` | `/api/editor/sections/reorder` | Zmie? kolejno?? |

### Warstwy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/editor/sections/{id}/layers` | Lista warstw |
| `POST` | `/api/editor/sections/{id}/layers` | Dodaj warstw? |
| `PUT` | `/api/editor/layers/{id}` | Edytuj |
| `DELETE` | `/api/editor/layers/{id}` | Usu? |
| `POST` | `/api/editor/layers/{id}/items` | Dodaj item |

### Efekty

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/editor/effects` | Lista dost?pnych efektów |
| `POST` | `/api/editor/layers/{id}/effects` | Dodaj efekt |
| `PUT` | `/api/editor/layer-effects/{id}` | Zmie? parametry |
| `DELETE` | `/api/editor/layer-effects/{id}` | Usu? efekt |
| `PUT` | `/api/editor/layers/{id}/effects/reorder` | Zmie? kolejno?? |

### Sample Packs

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/editor/sample-packs` | Lista paczek |
| `GET` | `/api/editor/sample-packs/{id}` | Szczegó?y paczki |
| `POST` | `/api/editor/sample-packs` | Utwórz paczk? |
| `POST` | `/api/editor/sample-packs/{id}/samples` | Dodaj sample |
| `GET` | `/api/editor/samples/{id}/preview` | Podgl?d sampla |

### Eksport

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/api/editor/projects/{id}/export` | Rozpocznij eksport |
| `GET` | `/api/editor/exports/{taskId}/status` | Status eksportu |
| `GET` | `/api/editor/exports/{taskId}/download` | Pobierz plik |

---

## Eksport projektu

### ??danie eksportu

```json
POST /api/editor/projects/1/export
{
  "format": "wav",
  "sampleRate": 44100,
  "bitDepth": 24,
  "normalize": true,
  "exportSections": [1, 2, 3],
  "exportStems": false
}
```

### Formaty eksportu

| Format | Opis |
|--------|------|
| `wav` | WAV (bezstratny) |
| `mp3` | MP3 320kbps |
| `flac` | FLAC (bezstratny, skompresowany) |
| `ogg` | OGG Vorbis |
| `aac` | AAC (M4A) |

### Status eksportu

```json
GET /api/editor/exports/abc123/status

Response:
{
  "taskId": "abc123",
  "status": "Processing",
  "progress": 65,
  "currentSection": "Verse 2",
  "estimatedTimeRemaining": 30
}
```

---

## Wspó?praca

### Dodawanie wspó?pracownika

```json
POST /api/editor/projects/1/collaborators
{
  "userId": 5,
  "permission": "Edit"
}
```

### Uprawnienia

| Uprawnienie | Opis |
|-------------|------|
| `Read` | Tylko odczyt |
| `Edit` | Edycja projektu |
| `Admin` | Pe?ne uprawnienia (w tym zapraszanie) |

---

## Przyk?ad tworzenia projektu

### 1. Utwórz projekt

```json
POST /api/editor/projects
{
  "name": "My Song",
  "bpm": 120,
  "timeSignature": "4/4"
}
```

### 2. Dodaj sekcj?

```json
POST /api/editor/projects/1/sections
{
  "name": "Intro",
  "startTime": "00:00:00",
  "duration": "00:00:16",
  "color": "#3498db"
}
```

### 3. Dodaj warstw?

```json
POST /api/editor/sections/1/layers
{
  "name": "Drums",
  "type": "Audio",
  "volume": 1.0,
  "pan": 0
}
```

### 4. Dodaj item (audio clip)

```json
POST /api/editor/layers/1/items
{
  "sourceFileId": 42,
  "startTime": "00:00:00",
  "duration": "00:00:16",
  "fadeIn": "00:00:00.5"
}
```

### 5. Dodaj efekt

```json
POST /api/editor/layers/1/effects
{
  "effectId": 3,
  "parameters": {
    "threshold": -6,
    "ratio": 4,
    "attack": 10,
    "release": 100
  }
}
```

### 6. Eksportuj

```json
POST /api/editor/projects/1/export
{
  "format": "mp3"
}
```

---

*Ostatnia aktualizacja: Luty 2026*
