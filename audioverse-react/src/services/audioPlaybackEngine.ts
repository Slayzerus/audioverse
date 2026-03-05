import { SimpleSynth } from './simpleSynth';
import { EffectSlot } from '../models/editor/audioTypes';
import { MidiCCEvent, MidiNote } from '../models/editor/midiTypes';
import { logger } from '../utils/logger';
const log = logger.scoped('AudioPlaybackEngine');

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/** Composite audio node with separate input/output routing */
interface CompositeAudioNode {
  input: AudioNode;
  output: AudioNode;
  dry?: AudioNode;
  connect?: (destination: AudioNode) => void;
}

// Minimal type definitions to resolve errors. Adjust as needed for your app.
export interface AudioClipData {
  id: string;
  buffer: AudioBuffer;
  startTime: number;
  duration: number;
  offset: number;
  volume: number;
  pan: number;
  stretchFactor?: number;
  effectChain?: EffectSlot[];
  layerId: number;
}

export interface MidiTrackData {
  layerId: number;
  notes: MidiNote[];
  instrument: OscillatorType;
  volume: number;
  ccEvents?: MidiCCEvent[];
}

export interface LoopRegion {
  start: number;
  end: number;
  enabled: boolean;
}

export class AudioPlaybackEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private clips: Map<string, AudioClipData> = new Map();
  private scheduledSources: Map<string, AudioBufferSourceNode> = new Map();
  private midiTracks: Map<number, MidiTrackData> = new Map();
  private synths: Map<number, SimpleSynth> = new Map();
  
  private isPlaying = false;
  private startTimeOffset = 0; // Where in the timeline we started
  private audioContextStartTime = 0; // When we started in AudioContext time
  private currentTime = 0;
  
  private loopRegion: LoopRegion = { start: 0, end: 0, enabled: false };
  private bpm = 120;
  private duration = 0;

  /**
   * Set MIDI CC automation events for a layer
   */
  setMidiCCEvents(layerId: number, ccEvents: MidiCCEvent[]) {
    const track = this.midiTracks.get(layerId);
    if (track) {
      track.ccEvents = ccEvents;
    }
  }

  /**
   * Get MIDI CC automation events for a layer
   */
  getMidiCCEvents(layerId: number): MidiCCEvent[] {
    const track = this.midiTracks.get(layerId);
    return track?.ccEvents || [];
  }

  /**
   * Add a single MIDI CC event to a layer
   */
  addMidiCCEvent(layerId: number, ccEvent: MidiCCEvent) {
    const track = this.midiTracks.get(layerId);
    if (track) {
      if (!track.ccEvents) track.ccEvents = [];
      track.ccEvents.push(ccEvent);
    }
  }

  /**
   * Remove a MIDI CC event by id from a layer
   */
  removeMidiCCEvent(layerId: number, ccEventId: number) {
    const track = this.midiTracks.get(layerId);
    if (track && track.ccEvents) {
      track.ccEvents = track.ccEvents.filter(ev => ev.id !== ccEventId);
    }
  }
  
  private onTimeUpdate?: (time: number) => void;
  private onPlayStateChange?: (playing: boolean) => void;
  
  constructor() {
    this.initAudioContext();
  }
  
  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterFilter = this.audioContext.createBiquadFilter();
      this.masterFilter.type = 'peaking';
      this.masterFilter.frequency.value = 1200;
      this.masterFilter.Q.value = 0.7;
      this.masterFilter.gain.value = 0;

      this.masterGain.connect(this.masterFilter);
      this.masterFilter.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.8;
      
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (error) {
      log.error('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Create effect node based on type and parameters
   */
  private createEffectNode(effect: EffectSlot): AudioNode | CompositeAudioNode | null {
    if (!this.audioContext || effect.bypass) return null;

    try {
      switch (effect.type) {
        case 'eq3': {
          // 3-band EQ using three biquad filters
          const low = this.audioContext.createBiquadFilter();
          const mid = this.audioContext.createBiquadFilter();
          const high = this.audioContext.createBiquadFilter();
          
          low.type = 'lowshelf';
          low.frequency.value = effect.params.lowFreq || 250;
          low.gain.value = effect.params.lowGain || 0;
          
          mid.type = 'peaking';
          mid.frequency.value = 1000;
          mid.Q.value = 1;
          mid.gain.value = effect.params.midGain || 0;
          
          high.type = 'highshelf';
          high.frequency.value = effect.params.highFreq || 4000;
          high.gain.value = effect.params.highGain || 0;
          
          low.connect(mid);
          mid.connect(high);
          
          // Return composite node (input = low, output = high)
          return { input: low, output: high } as CompositeAudioNode;
        }
        
        case 'compressor': {
          const comp = this.audioContext.createDynamicsCompressor();
          comp.threshold.value = effect.params.threshold || -24;
          comp.ratio.value = effect.params.ratio || 4;
          comp.attack.value = effect.params.attack || 0.003;
          comp.release.value = effect.params.release || 0.25;
          comp.knee.value = effect.params.knee || 30;
          return comp;
        }
        
        case 'delay': {
          const delay = this.audioContext.createDelay(5);
          delay.delayTime.value = effect.params.time || 0.25;
          
          const feedback = this.audioContext.createGain();
          feedback.gain.value = effect.params.feedback || 0.3;
          
          const wet = this.audioContext.createGain();
          wet.gain.value = effect.params.mix || 0.3;
          
          const dry = this.audioContext.createGain();
          dry.gain.value = 1 - (effect.params.mix || 0.3);
          
          // Feedback loop
          delay.connect(feedback);
          feedback.connect(delay);
          
          // Wet/dry mix
          delay.connect(wet);
          
          // Return composite node
          return {
            input: delay,
            output: wet,
            dry,
            connect: function(destination: AudioNode) {
              wet.connect(destination);
              dry.connect(destination);
            }
          } as CompositeAudioNode;
        }
        
        case 'reverb': {
          // Simple convolver reverb (would need impulse response in production)
          const convolver = this.audioContext.createConvolver();
          
          // Generate simple impulse response
          const length = this.audioContext.sampleRate * (effect.params.decay || 2);
          const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
          
          for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
              data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
          }
          
          convolver.buffer = impulse;
          
          const wet = this.audioContext.createGain();
          wet.gain.value = effect.params.mix || 0.3;
          
          const dry = this.audioContext.createGain();
          dry.gain.value = 1 - (effect.params.mix || 0.3);
          
          convolver.connect(wet);
          
          return {
            input: convolver,
            output: wet,
            dry,
            connect: function(destination: AudioNode) {
              wet.connect(destination);
              dry.connect(destination);
            }
          } as CompositeAudioNode;
        }
        
        case 'distortion': {
          const distortion = this.audioContext.createWaveShaper();
          
          const amount = effect.params.amount || 20;
          const samples = 44100;
          const curve = new Float32Array(samples);
          const deg = Math.PI / 180;
          
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
          }
          
          distortion.curve = curve;
          distortion.oversample = '4x';
          
          const wet = this.audioContext.createGain();
          wet.gain.value = effect.params.mix || 0.5;
          
          const dry = this.audioContext.createGain();
          dry.gain.value = 1 - (effect.params.mix || 0.5);
          
          distortion.connect(wet);
          
          return {
            input: distortion,
            output: wet,
            dry,
            connect: function(destination: AudioNode) {
              wet.connect(destination);
              dry.connect(destination);
            }
          } as CompositeAudioNode;
        }
        
        default:
          return null;
      }
    } catch (error) {
      log.error('Failed to create effect node:', effect.type, error);
      return null;
    }
  }
  // ...rest of the class as in previous reads...
  /**
   * Add audio clip to the engine
   */
  public addClip(clip: AudioClipData) {
    this.clips.set(clip.id, clip);
    this.updateDuration();
  }

  /**
   * Remove audio clip
   */
  public removeClip(clipId: string) {
    this.clips.delete(clipId);
    this.stopClip(clipId);
    this.updateDuration();
  }

  /**
   * Update clip properties
   */
  updateClip(clipId: string, updates: Partial<AudioClipData>) {
    const clip = this.clips.get(clipId);
    if (clip) {
      Object.assign(clip, updates);
      this.updateDuration();
    }
  }

  /**
   * Get all clips for a specific layer
   */
  getClipsByLayer(layerId: number): AudioClipData[] {
    return Array.from(this.clips.values()).filter(c => c.layerId === layerId);
  }

  /**
   * Set MIDI track data
   */
  public setMidiTrack(layerId: number, notes: MidiNote[], instrument: OscillatorType = 'sine', volume: number = 0.5) {
    this.midiTracks.set(layerId, { layerId, notes, instrument, volume });
    // Create synth for this layer if not exists
    if (!this.synths.has(layerId) && this.audioContext && this.masterGain) {
      const synth = new SimpleSynth(this.audioContext, this.masterGain);
      synth.setVolume(volume);
      this.synths.set(layerId, synth);
    }
  }

  /**
   * Remove MIDI track
   */
  public removeMidiTrack(layerId: number) {
    this.midiTracks.delete(layerId);
    const synth = this.synths.get(layerId);
    if (synth) {
      synth.dispose();
      this.synths.delete(layerId);
    }
  }

  /**
   * Update MIDI track volume
   */
  updateMidiTrackVolume(layerId: number, volume: number) {
    const track = this.midiTracks.get(layerId);
    if (track) {
      track.volume = volume;
    }
    const synth = this.synths.get(layerId);
    if (synth) {
      synth.setVolume(volume);
    }
  }

  /**
   * Calculate total project duration
   */
  private updateDuration() {
    let maxEnd = 0;
    this.clips.forEach(clip => {
      const clipEnd = clip.startTime + clip.duration;
      if (clipEnd > maxEnd) maxEnd = clipEnd;
    });
    this.duration = maxEnd;
  }

  /**
   * Start playback from current position
   */
  public play() {
    if (!this.audioContext || this.isPlaying) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.isPlaying = true;
    this.audioContextStartTime = this.audioContext.currentTime;
    this.startTimeOffset = this.currentTime;
    this.scheduleClips();
    this.scheduleMidiNotes();
    this.startTimeTracking();
    if (this.onPlayStateChange) {
      this.onPlayStateChange(true);
    }
  }

  /**
   * Pause playback (can resume)
   */
  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.stopAllSources();
    if (this.onPlayStateChange) {
      this.onPlayStateChange(false);
    }
  }

  /**
   * Stop playback (reset to start)
   */
  public stop() {
    this.pause();
    this.seek(0);
  }

  /**
   * Seek to specific time
   */
  public seek(time: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime);
    }
    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Schedule audio clips for playback
   */
  private scheduleClips() {
    if (!this.audioContext || !this.masterGain) return;
    this.clips.forEach(clip => {
      // Only schedule clips that should play from current position
      const clipEnd = clip.startTime + clip.duration;
      if (clipEnd <= this.currentTime) return; // Clip already passed
      const source = this.audioContext!.createBufferSource();
      source.buffer = clip.buffer;
      // Apply time stretch if specified
      if (clip.stretchFactor && clip.stretchFactor !== 1.0) {
        source.playbackRate.value = 1.0 / clip.stretchFactor;
      }
      // Create gain and pan nodes for this clip
      const gainNode = this.audioContext!.createGain();
      gainNode.gain.value = clip.volume;
      const panNode = this.audioContext!.createStereoPanner();
      panNode.pan.value = clip.pan;
      // Connect through effect chain if present
      source.connect(gainNode);
      let currentNode: AudioNode = gainNode;
      if (clip.effectChain && clip.effectChain.length > 0) {
        for (const effect of clip.effectChain) {
          const effectNode = this.createEffectNode(effect);
          if (effectNode) {
            // Handle composite nodes (with separate input/output)
            if ('input' in effectNode && 'output' in effectNode) {
              const composite = effectNode as unknown as CompositeAudioNode;
              currentNode.connect(composite.input);
              currentNode = composite.output;
              // Also connect dry signal if present
              if ('dry' in effectNode) {
                gainNode.connect(composite.dry!);
              }
            } else {
              currentNode.connect(effectNode);
              currentNode = effectNode;
            }
          }
        }
      }
      currentNode.connect(panNode);
      panNode.connect(this.masterGain!);
      // Calculate when to start
      const clipStartTime = clip.startTime;
      const playbackStartTime = Math.max(0, this.currentTime - clipStartTime);
      const audioContextTime = this.audioContext!.currentTime + (clipStartTime - this.currentTime);
      // Schedule playback
      if (audioContextTime >= this.audioContext!.currentTime) {
        source.start(
          audioContextTime,
          clip.offset + playbackStartTime,
          clip.duration - playbackStartTime
        );
        this.scheduledSources.set(clip.id, source);
        // Auto-cleanup when done
        source.onended = () => {
          this.scheduledSources.delete(clip.id);
        };
      }
    });
  }

  /**
   * Stop specific clip
   */
  private stopClip(clipId: string) {
    const source = this.scheduledSources.get(clipId);
    if (source) {
      try {
        source.stop();
      } catch (_e) {
        // Expected: AudioBufferSource may already be stopped
      }
      this.scheduledSources.delete(clipId);
    }
  }

  /**
   * Stop all playing sources
   */
  private stopAllSources() {
    this.scheduledSources.forEach(source => {
      try {
        source.stop();
      } catch (_e) {
        // Expected: AudioBufferSource may already be stopped
      }
    });
    this.scheduledSources.clear();
    // Stop all synths
    this.synths.forEach(synth => synth.stopAll());
  }

  /**
   * Schedule MIDI notes for playback
   */
  private scheduleMidiNotes() {
    if (!this.audioContext) return;
    this.midiTracks.forEach((track) => {
      const synth = this.synths.get(track.layerId);
      if (!synth) return;
      // Schedule MIDI notes
      track.notes.forEach((note) => {
        const noteEnd = note.start + note.duration;
        if (noteEnd <= this.currentTime) return; // Note already passed
        const playbackStartTime = Math.max(0, this.currentTime - note.start);
        const audioContextTime = this.audioContext!.currentTime + (note.start - this.currentTime);
        if (audioContextTime >= this.audioContext!.currentTime) {
          synth.scheduleNote(
            note.pitch,
            audioContextTime,
            note.duration - playbackStartTime,
            note.velocity,
            track.instrument
          );
        }
      });
      // Schedule MIDI CC events (automation) with per-point curve interpolation
      if (track.ccEvents && Array.isArray(track.ccEvents) && track.ccEvents.length > 0) {
        // Sort events by time
        const events = [...track.ccEvents].sort((a, b) => a.time - b.time);
        // Schedule initial value at first event
        const first = events[0];
        let prev = first;
        for (let i = 1; i < events.length; ++i) {
          const curr = events[i];
          const t0 = prev.time, t1 = curr.time;
          const v0 = prev.value, v1 = curr.value;
          const handle = prev.handleType || 'linear';
          // Schedule automation points between t0 and t1
          const steps = Math.max(2, Math.ceil((t1 - t0) * 20)); // 20 Hz automation resolution
          for (let s = 0; s <= steps; ++s) {
            const frac = s / steps;
            let vInterp = v0;
            if (handle === 'linear') {
              vInterp = v0 + (v1 - v0) * frac;
            } else if (handle === 'step') {
              vInterp = frac < 1 ? v0 : v1;
            } else if (handle === 'exp') {
              // Exponential interpolation (avoid log(0))
              const min = 1e-3;
              const norm0 = Math.max(v0 / 127, min);
              const norm1 = Math.max(v1 / 127, min);
              const expVal = norm0 * Math.pow(norm1 / norm0, frac);
              vInterp = expVal * 127;
            }
            const tInterp = t0 + (t1 - t0) * frac;
            const audioContextTime = this.audioContext!.currentTime + (tInterp - this.currentTime);
            if (audioContextTime >= this.audioContext!.currentTime) {
              if (typeof synth.applyCC === 'function') {
                synth.applyCC(curr.cc, vInterp, audioContextTime);
              }
            }
          }
          prev = curr;
        }
      }
    });
  }

  /**
   * Track playback time
   */
  private startTimeTracking() {
    if (!this.audioContext) return;
    const updateTime = () => {
      if (!this.isPlaying || !this.audioContext) return;
      const elapsed = this.audioContext.currentTime - this.audioContextStartTime;
      this.currentTime = this.startTimeOffset + elapsed;
      // Handle loop
      if (this.loopRegion.enabled) {
        if (this.currentTime >= this.loopRegion.end) {
          this.seek(this.loopRegion.start);
          return;
        }
      }
      // Stop at end
      if (this.currentTime >= this.duration) {
        this.stop();
        return;
      }
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentTime);
      }
      requestAnimationFrame(updateTime);
    };
    requestAnimationFrame(updateTime);
  }

  /**
   * Set loop region
   */
  public setLoopRegion(start: number, end: number, enabled: boolean) {
    this.loopRegion = { start, end, enabled };
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number) {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  /**
   * Get BPM
   */
  getBPM(): number {
    return this.bpm;
  }

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public setMasterFilter(options: { type?: BiquadFilterType; frequency?: number; q?: number; gain?: number }) {
    if (!this.masterFilter) return;
    if (options.type) this.masterFilter.type = options.type;
    if (options.frequency != null) this.masterFilter.frequency.value = Math.max(20, Math.min(20000, options.frequency));
    if (options.q != null) this.masterFilter.Q.value = Math.max(0.1, Math.min(18, options.q));
    if (options.gain != null && 'gain' in this.masterFilter) {
      this.masterFilter.gain.value = Math.max(-40, Math.min(40, options.gain));
    }
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Get project duration
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Check if playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set time update callback
   */
  setOnTimeUpdate(callback: (time: number) => void) {
    this.onTimeUpdate = callback;
  }

  /**
   * Set play state change callback
   */
  setOnPlayStateChange(callback: (playing: boolean) => void) {
    this.onPlayStateChange = callback;
  }

  /**
   * Cleanup
   */
  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.clips.clear();
  }
}

