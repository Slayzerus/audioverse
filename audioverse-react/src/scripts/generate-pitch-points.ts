import fs from 'fs';
import path from 'path';
import wav from 'wav-decoder';

function detectPitch(buffer: Float32Array, sampleRate: number, rmsThreshold: number = 0.01): number {
  const maxSamples = Math.floor(sampleRate / 50); // 50 Hz min
  if (buffer.length <= maxSamples) return 0;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < rmsThreshold) return 0;
  let lastCorrelation = 1;
  for (let offset = 50; offset < Math.min(maxSamples, Math.floor(buffer.length / 2)); offset++) {
    let correlation = 0;
    for (let i = 0; i < Math.min(buffer.length - offset, maxSamples); i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxSamples;
    if (correlation > bestCorrelation && correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
    lastCorrelation = correlation;
  }
  if (bestOffset === -1) return 0;
  return sampleRate / bestOffset;
}

async function decodeWav(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  return await wav.decode(buffer);
}

async function generatePoints(input: string, output?: string, opts?: {windowSec?: number; hopSec?: number; rmsThreshold?: number}) {
  const {windowSec = 0.1, hopSec = 0.05, rmsThreshold = 0.005} = opts || {};
  const decoded = await decodeWav(input);
  const sampleRate = decoded.sampleRate;
  const channelData = decoded.channelData && decoded.channelData.length > 0 ? decoded.channelData[0] : null;
  if (!channelData) throw new Error('No channel data found in WAV');

  const windowSize = Math.floor(windowSec * sampleRate);
  const hopSize = Math.floor(hopSec * sampleRate);
  const points: Array<{t: number; hz: number}> = [];
  for (let i = 0; i + windowSize <= channelData.length; i += hopSize) {
    const slice = channelData.subarray(i, i + windowSize);
    const hz = detectPitch(slice, sampleRate, rmsThreshold);
    const t = i / sampleRate;
    points.push({t, hz});
  }
  const outPath = output || path.join(path.dirname(input), 'points.json');
  fs.writeFileSync(outPath, JSON.stringify(points, null, 2), 'utf8');
  console.log(`Wrote ${points.length} points to ${outPath}`);
}

// CLI
(async function main() {
  try {
    const argv = process.argv.slice(2);
    if (argv.length === 0) {
      console.error('Usage: ts-node src/scripts/generate-pitch-points.ts <input.wav> [output.json] [windowSec] [hopSec] [rmsThreshold]');
      process.exit(2);
    }
    const input = argv[0];
    const output = argv[1];
    const windowSec = argv[2] ? parseFloat(argv[2]) : undefined;
    const hopSec = argv[3] ? parseFloat(argv[3]) : undefined;
    const rmsThreshold = argv[4] ? parseFloat(argv[4]) : undefined;
    await generatePoints(input, output, {windowSec, hopSec, rmsThreshold});
  } catch (err: unknown) {
    console.error(err instanceof Error && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
