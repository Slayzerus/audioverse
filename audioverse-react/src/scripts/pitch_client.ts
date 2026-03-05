// src/scripts/pitch_client.ts
// Production-ready TypeScript module for capturing audio and sending to pitch WS.
// For low-latency production use, consider replacing ScriptProcessor with an AudioWorklet.

export async function startPitchServer(wsUrl: string, onMessage?: (data: unknown) => void): Promise<WebSocket> {
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';
  ws.onopen = () => console.debug('pitch server ws open');
  ws.onmessage = (e: MessageEvent) => { try { onMessage && onMessage(JSON.parse(e.data as string)); } catch (_e) { /* Parse error expected for invalid input */ } };
  ws.onclose = () => console.debug('pitch server ws closed');
  ws.onerror = (e) => console.error('pitch ws error', e);
  return ws;
}

export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const l = float32Array.length;
  const buf = new ArrayBuffer(l * 2);
  const view = new DataView(buf);
  let offset = 0;
  for (let i = 0; i < l; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

export function resampleLinear(src: Float32Array, srcRate: number, dstRate: number): Float32Array {
  if (dstRate === srcRate) return src;
  const ratio = srcRate / dstRate;
  const dstLength = Math.floor(src.length / ratio);
  const out = new Float32Array(dstLength);
  for (let i = 0; i < dstLength; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, src.length - 1);
    const t = pos - i0;
    out[i] = (1 - t) * src[i0] + t * src[i1];
  }
  return out;
}

export interface CaptureController {
  stop: () => void;
}

export async function captureAndSendToWs(ws: WebSocket, opts: { deviceId?: string; frameMs?: number } = {}): Promise<CaptureController> {
  if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('ws not open');
  const frameMs = opts.frameMs || 100;
  const constraints: MediaStreamConstraints = { audio: { deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined, channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const src = ac.createMediaStreamSource(stream);
  let bufferAcc = new Float32Array(0);
  const sampleRate = ac.sampleRate;

  // Prefer AudioWorklet if available
  let processor: ScriptProcessorNode | null = null;
  let workletNode: AudioWorkletNode | null = null;
  try {
    if (ac.audioWorklet && ac.audioWorklet.addModule) {
      try { await ac.audioWorklet.addModule('/scripts/pitch-worklet.js'); } catch (e) { console.warn('audioWorklet.addModule failed', e); }
      try { workletNode = new AudioWorkletNode(ac as AudioContext, 'pitch-processor'); } catch (_e) { /* Expected: AudioWorkletNode creation may fail if processor not registered */ workletNode = null; }
      if (workletNode) {
        src.connect(workletNode);
        (workletNode as AudioWorkletNode).port.onmessage = (ev: MessageEvent) => {
          try {
            const arr = ev.data as Float32Array;
            const tmp = new Float32Array(bufferAcc.length + arr.length);
            tmp.set(bufferAcc, 0);
            tmp.set(arr, bufferAcc.length);
            bufferAcc = tmp;
          } catch (_e) { /* Best-effort — no action needed on failure */ }
        };
      }
    }
  } catch (_e) { /* ignore worklet errors */ }

  if (!workletNode) {
    // Fallback to ScriptProcessor
    processor = ac.createScriptProcessor(4096, 1, 1);
    src.connect(processor);
    try { processor.connect(ac.destination); } catch (_e) { /* Best-effort — no action needed on failure */ }
    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      const tmp = new Float32Array(bufferAcc.length + input.length);
      tmp.set(bufferAcc, 0);
      tmp.set(input, bufferAcc.length);
      bufferAcc = tmp;
    };
  }

  const interval = window.setInterval(() => {
    const samplesNeeded = Math.round((frameMs / 1000) * sampleRate);
    if (bufferAcc.length < 128) return; // wait for more data
    const take = bufferAcc.slice(0, Math.min(bufferAcc.length, samplesNeeded));
    bufferAcc = bufferAcc.slice(take.length);
    const out = resampleLinear(take, sampleRate, 16000);
    const ab = floatTo16BitPCM(out);
    try { ws.send(ab); } catch (e) { console.warn('ws send failed', e); }
  }, frameMs) as unknown as number;

  return {
    stop: () => {
      clearInterval(interval);
      try { if (processor) processor.disconnect(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
      try { if (workletNode) { (workletNode as AudioWorkletNode).port.close(); workletNode.disconnect(); } } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
      try { src.disconnect(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
      stream.getTracks().forEach(t => t.stop());
      try { ac.close(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
    }
  };
}

export function autoCorrelatePitch(buf: Float32Array, sampleRate: number): number {
  let bestOffset = -1, bestCorrelation = 0;
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.01) return 0;
  const maxLag = Math.floor(sampleRate / 50);
  for (let lag = 20; lag < maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < buf.length - lag; i++) corr += buf[i] * buf[i + lag];
    if (corr > bestCorrelation) { bestCorrelation = corr; bestOffset = lag; }
  }
  return bestOffset > 0 ? sampleRate / bestOffset : 0;
}

export async function captureComputePitchSend(ws: WebSocket, opts: { deviceId?: string; frameMs?: number } = {}): Promise<CaptureController> {
  if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('ws not open');
  const frameMs = opts.frameMs || 100;
  const constraints: MediaStreamConstraints = { audio: { deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined, channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const src = ac.createMediaStreamSource(stream);
  let bufferAcc = new Float32Array(0);

  // Prefer AudioWorklet if available
  let processor: ScriptProcessorNode | null = null;
  let workletNode: AudioWorkletNode | null = null;
  try {
    if (ac.audioWorklet && ac.audioWorklet.addModule) {
      try { await ac.audioWorklet.addModule('/scripts/pitch-worklet.js'); } catch (e) { console.warn('audioWorklet.addModule failed', e); }
      try { workletNode = new AudioWorkletNode(ac as AudioContext, 'pitch-processor'); } catch (_e) { /* Expected: AudioWorkletNode creation may fail if processor not registered */ workletNode = null; }
      if (workletNode) {
        src.connect(workletNode);
        (workletNode as AudioWorkletNode).port.onmessage = (ev: MessageEvent) => {
          try {
            const arr = ev.data as Float32Array;
            const tmp = new Float32Array(bufferAcc.length + arr.length);
            tmp.set(bufferAcc, 0);
            tmp.set(arr, bufferAcc.length);
            bufferAcc = tmp;
          } catch (_e) { /* Best-effort — no action needed on failure */ }
        };
      }
    }
  } catch (_e) { /* ignore worklet errors */ }

  if (!workletNode) {
    // Fallback to ScriptProcessor
    processor = ac.createScriptProcessor(4096, 1, 1);
    src.connect(processor);
    try { processor.connect(ac.destination); } catch (_e) { /* Best-effort — no action needed on failure */ }
    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      const tmp = new Float32Array(bufferAcc.length + input.length);
      tmp.set(bufferAcc, 0);
      tmp.set(input, bufferAcc.length);
      bufferAcc = tmp;
    };
  }

  const interval = window.setInterval(() => {
    const samplesNeeded = Math.round((frameMs / 1000) * ac.sampleRate);
    if (bufferAcc.length < samplesNeeded) return;
    const take = bufferAcc.slice(0, samplesNeeded);
    bufferAcc = bufferAcc.slice(take.length);
    const out = resampleLinear(take, ac.sampleRate, 16000);
    const hz = autoCorrelatePitch(out, 16000);
    const msg = JSON.stringify({ hz, confidence: hz > 50 ? 0.9 : 0.0, ts: Date.now() });
    try { ws.send(msg); } catch (e) { console.warn('ws send json failed', e); }
  }, frameMs) as unknown as number;

  return {
    stop: () => {
      clearInterval(interval);
      try { if (processor) processor.disconnect(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
      try { if (workletNode) { (workletNode as AudioWorkletNode).port.close(); workletNode.disconnect(); } } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
      try { src.disconnect(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
      stream.getTracks().forEach(t => t.stop());
      try { ac.close(); } catch (_e) { /* Silent catch — error is expected during cleanup/teardown */ }
    }
  };
}
