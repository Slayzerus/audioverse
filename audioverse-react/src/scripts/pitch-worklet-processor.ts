// AudioWorkletProcessor that forwards Float32 frames to the main thread
// Provide minimal ambient declarations so TypeScript build doesn't error in this helper file.
declare class AudioWorkletProcessor {
  port: MessagePort;
  constructor();
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

class PitchProcessor extends AudioWorkletProcessor {
  bufferSize = 128;
  constructor() {
    super();
  }
  process(inputs: Float32Array[][]) {
    try {
      const ch = inputs[0];
      if (!ch || !ch[0]) return true;
      const buf = ch[0];
      // copy to transferable Float32Array
      const out = new Float32Array(buf.length);
      out.set(buf);
      this.port.postMessage(out, [out.buffer]);
    } catch (_e) { /* Best-effort — no action needed on failure */ }
    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
