import React, { useEffect, useRef } from 'react';
import type { YouTubePlayer } from 'react-youtube';

interface Props {
  ultrastarText: string;
  audioUrl?: string | null;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  ytRef?: React.RefObject<YouTubePlayer | null>;
}

interface ParsedNote {
  lineIndex: number;
  start: number;
  duration: number;
}

/** Parse ultrastar text into display lines and timing notes. Handles : (standard), * (golden), F (freestyle) note types. */
function parseUltrastarForPreview(text: string): { lines: string[]; notes: ParsedNote[] } {
  const lines = (text || '').split(/\r?\n/).map(l => l.replace(/\s+$/, ''));
  const notes: ParsedNote[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^[:*F]\s/.test(l)) {
      const p = l.slice(1).trim().split(/\s+/);
      const s = parseInt(p[0] || '0', 10) / 10 || 0;
      const d = parseInt(p[1] || '0', 10) / 10 || 0.1;
      notes.push({ lineIndex: i, start: s, duration: d });
    }
  }
  return { lines, notes };
}

export default function KaraokePhaserRenderer({ ultrastarText, audioUrl, audioRef, ytRef }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  // Shared data refs that the Phaser scene reads from
  const linesRef = useRef<string[]>([]);
  const notesRef = useRef<ParsedNote[]>([]);
  const sceneRef = useRef<Phaser.Scene | null>(null);
  const audioUrlRef = useRef(audioUrl);
  audioUrlRef.current = audioUrl;

  // Update parsed data whenever ultrastarText changes (no game recreation)
  useEffect(() => {
    const { lines, notes } = parseUltrastarForPreview(ultrastarText);
    linesRef.current = lines;
    notesRef.current = notes;

    // If scene already exists, rebuild text objects
    const scene = sceneRef.current;
    if (scene && 'rebuildTexts' in scene && typeof (scene as { rebuildTexts: () => void }).rebuildTexts === 'function') {
      (scene as { rebuildTexts: () => void }).rebuildTexts();
    }
  }, [ultrastarText]);

  // Create Phaser game once on mount, destroy on unmount
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted || !containerRef.current) return;
      const PhaserModule = await import('phaser');
      const Phaser = ('default' in PhaserModule
        ? (PhaserModule as unknown as { default: typeof PhaserModule }).default
        : PhaserModule);

      if (!containerRef.current || !mounted) return;

      // Capture refs for closure
      const _linesRef = linesRef;
      const _notesRef = notesRef;
      const _sceneRef = sceneRef;
      const _audioRef = audioRef;
      const _ytRef = ytRef;
      const _audioUrlRef = audioUrlRef;

      class PreviewScene extends Phaser.Scene {
        texts: Phaser.GameObjects.Text[] = [];
        audioEl: HTMLAudioElement | null = null;

        constructor() { super({ key: 'preview' }); }

        create() {
          _sceneRef.current = this;
          this.rebuildTexts();

          // Set up audio source
          if (_ytRef?.current) {
            this.audioEl = null;
          } else if (_audioRef?.current) {
            this.audioEl = _audioRef.current;
          } else {
            const globalAudio = document.querySelector('audio');
            if (globalAudio instanceof HTMLAudioElement) {
              this.audioEl = globalAudio;
            } else if (_audioUrlRef.current) {
              this.audioEl = document.createElement('audio');
              this.audioEl.src = _audioUrlRef.current;
              this.audioEl.preload = 'metadata';
              this.audioEl.style.display = 'none';
              document.body.appendChild(this.audioEl);
            } else {
              this.audioEl = null;
            }
          }
        }

        /** Rebuild text objects from the shared linesRef (called on data update). */
        rebuildTexts() {
          // Destroy existing text objects
          for (const t of this.texts) t.destroy();
          this.texts = [];

          const style: Phaser.Types.GameObjects.Text.TextStyle = { font: '18px monospace', color: '#ffffff' };
          const gap = 22;
          let y = 20;
          const lines = _linesRef.current;
          for (let i = 0; i < lines.length; i++) {
            const t = this.add.text(10, y, lines[i] || ' ', style).setOrigin(0, 0);
            this.texts.push(t);
            y += gap;
          }
        }

        update() {
          let t = 0;
          if (_ytRef?.current && typeof _ytRef.current.getCurrentTime === 'function') {
            try { t = _ytRef.current.getCurrentTime() || 0; } catch { t = 0; }
          } else {
            t = this.audioEl ? (this.audioEl.currentTime || 0) : 0;
          }
          // Reset styles
          for (let i = 0; i < this.texts.length; i++) {
            this.texts[i].setStyle({ backgroundColor: undefined, color: '#ffffff' });
          }
          // Highlight active note
          const notes = _notesRef.current;
          for (const n of notes) {
            if (t >= n.start && t < n.start + Math.max(0.001, n.duration)) {
              const txt = this.texts[n.lineIndex];
              if (txt) {
                txt.setStyle({ backgroundColor: 'rgba(0,130,200,0.16)', color: '#00aaff' });
              }
            }
          }
        }
      }

      const containerWidth = containerRef.current?.clientWidth ?? 640;
      const config = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: containerWidth,
        height: Math.round(containerWidth / 2),
        backgroundColor: '#101010',
        scene: [PreviewScene]
      } satisfies Phaser.Types.Core.GameConfig;

      phaserGameRef.current = new Phaser.Game(config);
    })();

    return () => {
      mounted = false;
      sceneRef.current = null;
      try {
        const g = phaserGameRef.current;
        if (g && typeof g.destroy === 'function') {
          g.destroy(true);
        }
      } catch { /* Expected: Phaser game instance may already be destroyed */ }
    };
  // Game creation depends only on mount/unmount — not on text changes
  // Mount-only: Phaser game instance created and destroyed with component lifecycle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: 340 }} />;
}
