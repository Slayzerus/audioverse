// ...existing code...
/**
 * Simple Synthesizer for MIDI playback
 * Uses Web Audio API OscillatorNode
 */

export class SimpleSynth {
    /**
     * Apply a MIDI CC value (automation) at a given time
     * (Stub: implement mapping for CC1, CC11, etc.)
     */
    applyCC(_cc: number, _value: number, _time: number) {
      // Example: CC1 (mod wheel), CC11 (expression)
      // This is a stub. Actual mapping to synth parameters should be implemented.
      // e.g., if (cc === 1) { /* mod wheel */ }
      //       if (cc === 11) { /* expression */ }
    }
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private activeNotes: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();

  constructor(audioContext: AudioContext, destination: AudioNode) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(destination);
  }

  /**
   * Convert MIDI note number to frequency in Hz
   */
  private midiToFreq(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  /**
   * Play a note immediately
   */
  playNote(
    pitch: number,
    velocity: number = 100,
    duration: number = 1.0,
    waveform: OscillatorType = 'sine'
  ) {
    const freq = this.midiToFreq(pitch);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = waveform;
    osc.frequency.value = freq;

    // Velocity to gain (0-127 -> 0-1)
    const velocityGain = (velocity / 127) * 0.8;
    gain.gain.value = velocityGain;

    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime;
    
    // ADSR envelope (simple)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(velocityGain, now + 0.01); // Attack
    gain.gain.exponentialRampToValueAtTime(velocityGain * 0.7, now + 0.1); // Decay
    gain.gain.setValueAtTime(velocityGain * 0.7, now + duration - 0.05); // Sustain
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

    osc.start(now);
    osc.stop(now + duration);

    // Cleanup
    osc.onended = () => {
      gain.disconnect();
      osc.disconnect();
    };

    return { osc, gain };
  }

  /**
   * Schedule a note to play at specific time
   */
  scheduleNote(
    pitch: number,
    startTime: number,
    duration: number,
    velocity: number = 100,
    waveform: OscillatorType = 'sine'
  ) {
    const freq = this.midiToFreq(pitch);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = waveform;
    osc.frequency.value = freq;

    const velocityGain = (velocity / 127) * 0.8;

    osc.connect(gain);
    gain.connect(this.masterGain);

    const contextStartTime = startTime;
    
    // ADSR envelope
    gain.gain.setValueAtTime(0, contextStartTime);
    gain.gain.linearRampToValueAtTime(velocityGain, contextStartTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(velocityGain * 0.7, contextStartTime + 0.1);
    gain.gain.setValueAtTime(velocityGain * 0.7, contextStartTime + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, contextStartTime + duration);

    osc.start(contextStartTime);
    osc.stop(contextStartTime + duration);

    osc.onended = () => {
      gain.disconnect();
      osc.disconnect();
    };

    return { osc, gain };
  }

  /**
   * Set master volume
   */
  setVolume(volume: number) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Stop all notes
   */
  stopAll() {
    this.activeNotes.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        gain.disconnect();
        osc.disconnect();
      } catch (_e) {
        // Expected: oscillator/gain may already be stopped or disconnected
      }
    });
    this.activeNotes.clear();
  }

  /**
   * Dispose synth
   */
  dispose() {
    this.stopAll();
    this.masterGain.disconnect();
  }
}
