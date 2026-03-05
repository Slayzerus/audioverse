class PitchProcessor extends AudioWorkletProcessor {
  constructor() { super(); }
  process(inputs) {
    try {
      const ch = inputs[0];
      if (!ch || !ch[0]) return true;
      const buf = ch[0];
      const out = new Float32Array(buf.length);
      out.set(buf);
      this.port.postMessage(out, [out.buffer]);
    } catch (e) {}
    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
