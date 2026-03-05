/**
 * convert_wav_to_mp3.mjs — Convert all WAV note samples to MP3 using ffmpeg-static.
 *
 * Usage: node scripts/convert_wav_to_mp3.mjs
 *
 * Reads from public/assets/soundfonts/notes/{set}/note-*.wav
 * Writes to  public/assets/soundfonts/notes/{set}/note-*.mp3
 * Then deletes the .wav originals.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTES_ROOT = path.join(__dirname, '..', 'public', 'assets', 'soundfonts', 'notes');

const SETS = ['synth', 'concert-harp', 'celtic-harp', 'triangle'];
const BITRATE = '48k'; // kbps — plenty for short mono note samples

let totalWav = 0, totalMp3 = 0, fileCount = 0;

for (const setName of SETS) {
  const setDir = path.join(NOTES_ROOT, setName);
  if (!fs.existsSync(setDir)) {
    console.log(`  ⚠ Skipping ${setName} — directory not found`);
    continue;
  }

  const wavFiles = fs.readdirSync(setDir).filter(f => f.endsWith('.wav')).sort();
  console.log(`\n${setName}/ (${wavFiles.length} files)`);

  for (const wavFile of wavFiles) {
    const wavPath = path.join(setDir, wavFile);
    const mp3Path = path.join(setDir, wavFile.replace('.wav', '.mp3'));

    // ffmpeg -i input.wav -b:a 48k -ac 1 output.mp3
    execFileSync(ffmpegPath, [
      '-y', '-i', wavPath,
      '-b:a', BITRATE,
      '-ac', '1',
      mp3Path,
    ], { stdio: 'pipe' });

    const wavSize = fs.statSync(wavPath).size;
    const mp3Size = fs.statSync(mp3Path).size;
    totalWav += wavSize;
    totalMp3 += mp3Size;
    fileCount++;

    console.log(`  ✓ ${wavFile} (${(wavSize/1024).toFixed(1)}KB) → ${wavFile.replace('.wav','.mp3')} (${(mp3Size/1024).toFixed(1)}KB) — ${Math.round((1 - mp3Size/wavSize)*100)}% smaller`);

    // Delete the WAV original
    fs.unlinkSync(wavPath);
  }
}

console.log(`\nDone — ${fileCount} files converted`);
console.log(`  WAV total: ${(totalWav/1024).toFixed(0)} KB`);
console.log(`  MP3 total: ${(totalMp3/1024).toFixed(0)} KB`);
console.log(`  Saved:     ${((totalWav-totalMp3)/1024).toFixed(0)} KB (${Math.round((1-totalMp3/totalWav)*100)}%)`);
