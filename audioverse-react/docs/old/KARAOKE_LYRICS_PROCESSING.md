# Karaoke Lyrics Processing Analysis

## File Format: UltraStar (.txt)

### Format Specification
The UltraStar karaoke format uses the following line types:

```
: startBeat duration pitch text     # Regular note/syllable
* startBeat duration pitch text     # Golden note (bonus points)
- beat                              # Line break (end of verse)
E                                   # End of file
#FIELD:value                        # Metadata (title, artist, etc.)
```

### Beat to Time Conversion
- **Beats** are converted to **seconds** by dividing by 10
- Example: beat 100 = 10 seconds

---

## Example Parsing: "Living Next Door To Alice"

### Raw Input
```
: 0 2 1 Sal
: 4 1 4 ly
: 8 7 2  called
- 22
: 25 2 1 when
: 29 1 1  she
```

### Processing Steps

#### Step 1: Individual Words/Syllables
| Word | Beat | Duration | Pitch | Time (s) | End Time | Type |
|------|------|----------|-------|----------|----------|------|
| Sal | 0 | 2 | 1 | 0.0 | 0.2 | Regular |
| ly | 4 | 1 | 4 | 0.4 | 0.5 | Regular |
| called | 8 | 7 | 2 | 0.8 | 1.5 | Regular |
| when | 25 | 2 | 1 | 2.5 | 2.7 | Regular |
| she | 29 | 1 | 1 | 2.9 | 3.0 | Regular |

#### Step 2: Grouping into Verses (Lines)
A verse is a group of words between line breaks (`-`):

**Verse 1** (starts at 0.0s):
```
Text: "Sal ly called"
Words: [
  { text: "Sal", startTime: 0.0, endTime: 0.2, isGolden: false },
  { text: "ly", startTime: 0.4, endTime: 0.5, isGolden: false },
  { text: "called", startTime: 0.8, endTime: 1.5, isGolden: false }
]
```

**Verse 2** (starts at 2.5s):
```
Text: "when she..."
Words: [
  { text: "when", startTime: 2.5, endTime: 2.7, isGolden: false },
  { text: "she", startTime: 2.9, endTime: 3.0, isGolden: false },
  ...
]
```

---

## Current Implementation

### Files Involved

#### 1. **karaokeLyrics.ts**
```typescript
// Parses notes into verses with full text
parseLyrics(notes: string[]): KaraokeLine[]

// NEW: Parses notes into verses with detailed word information
parseVersesWithWords(notes: string[]): KaraokeVerse[]

// Gets verses active at current playback time
getActiveLyrics(lyrics: KaraokeLine[], currentTime: number): string[]

// NEW: Gets words active at current playback time
getActiveWords(verses: KaraokeVerse[], currentTime: number): KaraokeWord[]
```

#### 2. **karaokeTimeline.ts**
```typescript
// Parses notes for rendering on canvas
parseNotes(notes: string[]): KaraokeNoteData[][]

// Draws the timeline visualization
drawTimeline(ctx, width, height, noteLines, currentTime, ...)
```

#### 3. **KaraokeManager.tsx**
- Loads the .txt file via `KaraokeUploader`
- Sends file content (base64) to API `/parse-ultrastar`
- API returns parsed `KaraokeSongFile` with metadata and notes array
- Passes notes to timeline and lyrics components

---

## Data Flow

```
User Upload (.txt file)
    ↓
KaraokeUploader (reads file as text, converts to base64)
    ↓
API: /api/karaoke/parse-ultrastar (Backend parses metadata)
    ↓
KaraokeSongFile { notes: KaraokeNote[] }
    ↓
KaraokeManager
    ├─→ KaraokeTimeline (uses parseNotes for rendering)
    ├─→ KaraokeLyrics (uses parseLyrics/parseVersesWithWords)
    └─→ GenericPlayer (plays audio/video)
```

---

## Data Structures

### KaraokeNote (Stored in DB/File)
```typescript
interface KaraokeNote {
  id?: number;
  songId?: number;
  noteLine: string;  // Raw line from file: ": 0 2 1 Sal"
}
```

### KaraokeWord (In-Memory, for Display)
```typescript
interface KaraokeWord {
  text: string;           // "Sal"
  startTime: number;      // 0.0 (seconds)
  endTime: number;        // 0.2
  isGolden: boolean;      // false (or true for *)
}
```

### KaraokeVerse (In-Memory, for Display)
```typescript
interface KaraokeVerse {
  text: string;           // "Sal ly called"
  timestamp: number;      // 0.0 (verse start time)
  words: KaraokeWord[];   // [ {Sal}, {ly}, {called} ]
}
```

---

## Key Improvements Made

1. **New `parseVersesWithWords()` function**
   - Returns detailed word-level information with precise timing
   - Useful for highlighting individual words as they're sung
   - Includes `isGolden` flag for bonus notes (*)

2. **New `getActiveWords()` function**
   - Returns words currently being sung at any given time
   - Can be used to highlight the current word in real-time

3. **Backward Compatibility**
   - Original `parseLyrics()` still works for basic verse display
   - Both functions can coexist and be used depending on needs

4. **Better Type Safety**
   - Explicit interfaces for Word, Verse, and Line types
   - Easier to extend with additional metadata

---

## Usage Examples

### Display Current Verse
```typescript
const verses = parseVersesWithWords(song.notes.map(n => n.noteLine));
const activeVerses = verses.filter(v => 
  currentTime >= v.timestamp && 
  currentTime < (verses[verses.indexOf(v) + 1]?.timestamp ?? currentTime + 5)
);
// Show activeVerses on screen
```

### Highlight Current Word
```typescript
const activeWords = getActiveWords(verses, currentTime);
activeWords.forEach(word => {
  // Render word with highlighting/different color
  // Show word.text, maybe apply animation
});
```

### Full Verse with Dynamic Word Highlighting
```typescript
{verse.text}
{verse.words.map(word => (
  <span key={word.text} style={{
    color: isWordActive(word, currentTime) ? 'yellow' : 'white'
  }}>
    {word.text}
  </span>
))}
```

---

## Debugging

Enable console logs to see detailed parsing:

```typescript
// See in browser console:
// Starting to parseLyrics
// #: 0 2 1 Sal--- line
// #: 4 1 4 ly--- line
// #: 8 7 2  called--- line
// #- 22--- ender
// ✅ Poprawnie przetworzone wersety z słowami: [...]
```

---

## Summary

Your example file "Smokie - Living Next Door To Alice.txt" would be processed as:
- **452 syllables** grouped into verses
- Each syllable has precise timing (start/end in seconds)
- Verses marked by `-` line breaks
- Complete metadata extracted from `#FIELD:` lines
- Ready for real-time lyrics display with word-level highlighting
