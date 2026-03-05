import fs from 'fs/promises';
import path from 'path';
import { scoreNotesWithPitchPoints, NoteDescriptor, ScoringResult } from '../utils/karaokeScoring';
import { ScoringPreset, DefaultScoringPresets, DifficultyLevel } from '../constants/karaokeScoringConfig';

interface ParityEntry {
  song: string;
  difficulty: string;
  total: number;
  totalWithBonuses: number;
  perNote: ScoringResult['perNote'];
}

type PitchPoint = { t: number; hz: number };

const argv = process.argv.slice(2);
const fixturesDir = (() => {
  const i = argv.indexOf('--fixtures');
  if (i >= 0) return argv[i + 1];
  return path.join(process.cwd(), 'parity-fixtures');
})();
const outJson = (() => {
  const i = argv.indexOf('--out');
  if (i >= 0) return argv[i + 1];
  return path.join(process.cwd(), 'parity-results.json');
})();
const outCsv = (() => {
  const i = argv.indexOf('--out-csv');
  if (i >= 0) return argv[i + 1];
  return path.join(process.cwd(), 'parity-results.csv');
})();

async function loadJson<T>(p: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as T;
  } catch (_e) {
    /* Expected: fixture file may not exist or contain invalid JSON */
    return null;
  }
}

async function run() {
  console.log('Parity runner starting');
  console.log('Fixtures dir:', fixturesDir);
  try {
    const items = await fs.readdir(fixturesDir, { withFileTypes: true });
    const results: ParityEntry[] = [];
    for (const it of items) {
      if (!it.isDirectory()) continue;
      const songDir = path.join(fixturesDir, it.name);
      const notesPath = path.join(songDir, 'notes.json');
      const pointsPath = path.join(songDir, 'points.json');
      const notes = await loadJson<NoteDescriptor[]>(notesPath);
      const points = await loadJson<PitchPoint[]>(pointsPath);
      if (!notes || !points) {
        console.warn(`Skipping ${it.name} — missing notes.json or points.json`);
        continue;
      }
      // Run for each difficulty preset
      for (const level of Object.keys(DefaultScoringPresets) as DifficultyLevel[]) {
        const preset: ScoringPreset = DefaultScoringPresets[level];
        const res = scoreNotesWithPitchPoints(notes as NoteDescriptor[], points as PitchPoint[], preset);
        const totalWithBonuses = res.totalScore;
        results.push({ song: it.name, difficulty: level, total: res.total, totalWithBonuses, perNote: res.perNote });
      }
    }
    await fs.writeFile(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');
    console.log('Wrote JSON results to', outJson);
    // write a summary CSV
    const header = ['song', 'difficulty', 'total', 'totalWithBonuses'];
    const rows = [header.join(',')];
    for (const r of results) rows.push([r.song, r.difficulty, String(r.total), String(r.totalWithBonuses)].map(s => `"${String(s).replace(/"/g,'""')}"`).join(','));
    await fs.writeFile(outCsv, rows.join('\n'), 'utf8');
    console.log('Wrote CSV summary to', outCsv);
    console.log('Done.');
  } catch (e) {
    console.error('Parity runner failed:', e);
    process.exit(1);
  }
}

run();
