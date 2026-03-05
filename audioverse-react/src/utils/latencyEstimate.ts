// Lightweight latency estimator using envelope cross-correlation.
// Produces an estimated latency in milliseconds between a short reference click
// placed at `clickAtMs` and the recorded buffer.

export function makeClickReference(totalMs: number, sampleRate: number, clickAtMs = 50, clickWidthMs = 30) {
  const totalSamples = Math.round((totalMs / 1000) * sampleRate);
  const clickAtSample = Math.round((clickAtMs / 1000) * sampleRate);
  const widthSamples = Math.max(1, Math.round((clickWidthMs / 1000) * sampleRate));
  const ref = new Float32Array(totalSamples);
  for (let i = 0; i < widthSamples; i++) {
    // simple windowed pulse (Hann)
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (widthSamples - 1)));
    const idx = clickAtSample + i - Math.floor(widthSamples / 2);
    if (idx >= 0 && idx < totalSamples) ref[idx] = w;
  }
  return ref;
}

function downsampleEnvelope(buf: Float32Array, sampleRate: number, targetHz = 1000) {
  const factor = Math.max(1, Math.round(sampleRate / targetHz));
  const outLen = Math.ceil(buf.length / factor);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = i * factor;
    const end = Math.min(buf.length, start + factor);
    let acc = 0;
    for (let j = start; j < end; j++) acc += Math.abs(buf[j]);
    out[i] = acc / (end - start || 1);
  }
  // normalize
  let max = 0;
  for (let i = 0; i < out.length; i++) if (out[i] > max) max = out[i];
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] = out[i] / max;
  return { env: out, factor };
}

// normalized cross-correlation (direct, on envelopes). Returns lag in samples (positive = recorded delayed after reference)
function xcorr(ref: Float32Array, rec: Float32Array) {
  const nRef = ref.length;
  const nRec = rec.length;
  if (nRef === 0 || nRec === 0) return 0;
  let best = { lag: 0, score: -Infinity };
  // slide ref across rec within reasonable bounds
  const maxLag = Math.min(2000, nRec); // limit search
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let num = 0, den1 = 0, den2 = 0;
    for (let i = 0; i < nRef; i++) {
      const j = i + lag + Math.floor((nRec - nRef) / 2);
      if (j < 0 || j >= nRec) continue;
      const a = ref[i];
      const b = rec[j];
      num += a * b;
      den1 += a * a;
      den2 += b * b;
    }
    const denom = Math.sqrt(Math.max(1e-9, den1 * den2));
    const score = num / denom;
    if (score > best.score) best = { lag, score };
  }
  return best.lag;
}

export function estimateLatencyMsFromRecording(recorded: Float32Array, sampleRate: number, clickAtMs = 50, clickWidthMs = 30) : number | null {
  try {
    const totalMs = Math.max(300, Math.round((recorded.length / sampleRate) * 1000));
    const ref = makeClickReference(totalMs, sampleRate, clickAtMs, clickWidthMs);
    const recEnv = downsampleEnvelope(recorded, sampleRate, 1000);
    const refEnv = downsampleEnvelope(ref, sampleRate, 1000);
    const lag = xcorr(refEnv.env, recEnv.env); // lag in envelope samples (1 kHz)
    const lagMs = (lag * 1000) / (1000); // since envelope is 1kHz
    // compute approximate offset: detectionTime - scheduledClickTime
    return Math.round(lagMs);
  } catch (_e) {
    /* Expected: cross-correlation or audio processing may fail on edge-case data */
    return null;
  }
}

export default { estimateLatencyMsFromRecording, makeClickReference };
