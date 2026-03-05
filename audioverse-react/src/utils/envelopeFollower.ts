/**
 * Envelope Follower — tracks amplitude of audio signal and maps to CC values.
 * Useful for dynamic control of effects based on audio level.
 */

export interface EnvelopeFollowerConfig {
  /** Attack time in seconds (how fast the envelope rises) */
  attackTime: number;
  /** Release time in seconds (how fast the envelope falls) */
  releaseTime: number;
  /** Sensitivity multiplier (1 = normal) */
  sensitivity: number;
  /** Floor — minimum input level to trigger (0-1) */
  floor: number;
  /** Ceiling — maximum output value (0-127) */
  ceiling: number;
  /** Target CC number */
  cc: number;
  /** Invert the output */
  invert: boolean;
  /** Smoothing factor (0-1) */
  smoothing: number;
}

export const DEFAULT_ENVELOPE_CONFIG: EnvelopeFollowerConfig = {
  attackTime: 0.01,
  releaseTime: 0.1,
  sensitivity: 1.0,
  floor: 0.01,
  ceiling: 127,
  cc: 11, // Expression
  invert: false,
  smoothing: 0.3,
};

/**
 * Process a block of audio samples and return the envelope value (0-1).
 * Uses a simple peak follower with attack/release.
 */
export function processEnvelopeBlock(
  samples: Float32Array,
  previousEnvelope: number,
  config: EnvelopeFollowerConfig,
  sampleRate: number = 44100,
): number {
  const attackCoeff = 1 - Math.exp(-1 / (config.attackTime * sampleRate));
  const releaseCoeff = 1 - Math.exp(-1 / (config.releaseTime * sampleRate));

  let envelope = previousEnvelope;

  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]) * config.sensitivity;
    const coeff = abs > envelope ? attackCoeff : releaseCoeff;
    envelope = envelope + coeff * (abs - envelope);
  }

  return envelope;
}

/**
 * Convert an envelope value (0-1) to a CC value (0-127).
 */
export function envelopeToCC(
  envelope: number,
  config: EnvelopeFollowerConfig
): number {
  if (envelope < config.floor) return config.invert ? Math.round(config.ceiling) : 0;

  const normalized = Math.min(1, (envelope - config.floor) / (1 - config.floor));
  const smoothed = normalized; // smoothing applied in the follower itself
  const ccValue = smoothed * config.ceiling;
  const result = config.invert ? config.ceiling - ccValue : ccValue;

  return Math.max(0, Math.min(127, Math.round(result)));
}

/**
 * Analyze a full audio buffer and generate CC events at specified intervals.
 */
export function analyzeBufferToCC(
  audioBuffer: AudioBuffer,
  config: EnvelopeFollowerConfig,
  intervalMs: number = 10,
  channel: number = 0,
): Array<{ time: number; value: number; cc: number }> {
  const samples = audioBuffer.getChannelData(channel);
  const sampleRate = audioBuffer.sampleRate;
  const blockSize = Math.floor((intervalMs / 1000) * sampleRate);
  const events: Array<{ time: number; value: number; cc: number }> = [];

  let envelope = 0;
  let prevCC = -1;

  for (let i = 0; i < samples.length; i += blockSize) {
    const block = samples.subarray(i, Math.min(i + blockSize, samples.length));
    envelope = processEnvelopeBlock(block, envelope, config, sampleRate);
    const ccValue = envelopeToCC(envelope, config);

    // Only emit if value changed (deduplicate)
    if (ccValue !== prevCC) {
      events.push({
        time: i / sampleRate,
        value: ccValue,
        cc: config.cc,
      });
      prevCC = ccValue;
    }
  }

  return events;
}

/**
 * Create an AudioWorklet-compatible envelope follower processor code.
 * Returns the processor source as a string for use with AudioWorkletNode.
 */
export function getEnvelopeFollowerWorkletCode(): string {
  return `
class EnvelopeFollowerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.envelope = 0;
    this.attackCoeff = 0.01;
    this.releaseCoeff = 0.001;
    this.port.onmessage = (e) => {
      if (e.data.attackTime) this.attackCoeff = 1 - Math.exp(-1 / (e.data.attackTime * sampleRate));
      if (e.data.releaseTime) this.releaseCoeff = 1 - Math.exp(-1 / (e.data.releaseTime * sampleRate));
    };
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      const abs = Math.abs(input[i]);
      const coeff = abs > this.envelope ? this.attackCoeff : this.releaseCoeff;
      this.envelope += coeff * (abs - this.envelope);
    }
    this.port.postMessage({ envelope: this.envelope });
    return true;
  }
}
registerProcessor('envelope-follower', EnvelopeFollowerProcessor);
`;
}
