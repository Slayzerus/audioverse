import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Col, Form, Row, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
    generateSeed,
    DEFAULT_SEED_CONFIG,
    SCALE_NAMES,
    PROGRESSION_NAMES,
    DRUM_PATTERN_NAMES,
    NOTE_NAMES,
    type SeedConfig,
    type SeedResult,
} from "../../scripts/midi/midiSeedGenerator";
import type { MidiNote } from "../../models/editor/midiTypes";

/* ────────────────────────────────────────────────────────────
   MidiSeedDemo
   Interactive panel to generate multi-layer MIDI seed data
   for the AudioEditor.  Shows a mini piano-roll preview
   and allows importing the generated notes into editor layers.
   ──────────────────────────────────────────────────────────── */

interface MidiSeedDemoProps {
    /** Called when user clicks "Import to Editor" with generated seed data. */
    onImport?: (seed: SeedResult) => void;
}

// ── Mini Piano Roll ──

const LAYER_COLORS: Record<string, string> = {
    melody: "var(--accent, #ff6b6b)",
    bass:   "var(--accent-secondary, #4ecdc4)",
    chords: "var(--gold-light, #ffe66d)",
    drums:  "var(--accent-hover, #a29bfe)",
};

const LAYER_LABELS: Record<string, string> = {
    melody: "🎵 Melodia",
    bass:   "🎸 Bas",
    chords: "🎹 Akordy",
    drums:  "🥁 Perkusja",
};

const MiniPianoRoll: React.FC<{ seed: SeedResult; visibleLayers: Set<string> }> = ({ seed, visibleLayers }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const width = 800;
    const height = 200;

    const allNotes = useMemo(() => {
        const entries: { note: MidiNote; layer: string }[] = [];
        for (const layer of ["melody", "bass", "chords", "drums"] as const) {
            if (!visibleLayers.has(layer)) continue;
            for (const n of seed[layer]) entries.push({ note: n, layer });
        }
        return entries;
    }, [seed, visibleLayers]);

    // Draw
    React.useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "var(--bg-primary, #0d0d1a)";
        ctx.fillRect(0, 0, width, height);

        if (allNotes.length === 0) return;

        const maxTime = Math.max(...allNotes.map(e => e.note.start + e.note.duration), 1);
        const minPitch = Math.min(...allNotes.map(e => e.note.pitch));
        const maxPitch = Math.max(...allNotes.map(e => e.note.pitch));
        const pitchRange = Math.max(maxPitch - minPitch, 12);

        const xScale = width / maxTime;
        const yScale = (height - 20) / pitchRange;

        // Grid lines
        ctx.strokeStyle = "var(--border-muted, #222)";
        const barDur = (60 / seed.config.tempo) * 4;
        for (let t = 0; t <= maxTime; t += barDur) {
            const x = t * xScale;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Notes
        for (const { note, layer } of allNotes) {
            const x = note.start * xScale;
            const w = Math.max(note.duration * xScale, 2);
            const y = height - 10 - (note.pitch - minPitch) * yScale;
            const h = Math.max(yScale * 0.8, 2);
            ctx.fillStyle = LAYER_COLORS[layer] ?? "#fff";
            ctx.globalAlpha = (note.velocity / 127) * 0.7 + 0.3;
            ctx.fillRect(x, y - h, w, h);
        }
        ctx.globalAlpha = 1;
    }, [allNotes, seed.config.tempo]);

    return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: 200, borderRadius: 8, border: "1px solid var(--border-muted, #333)" }}  role="img" aria-label="Midi Seed Demo canvas"/>;
};

// ── Main Component ──

const MidiSeedDemo: React.FC<MidiSeedDemoProps> = ({ onImport }) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<SeedConfig>({ ...DEFAULT_SEED_CONFIG });
    const [seed, setSeed] = useState<SeedResult | null>(null);
    const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(["melody", "bass", "chords", "drums"]));

    const handleGenerate = useCallback(() => {
        const result = generateSeed(config);
        setSeed(result);
    }, [config]);

    const toggleLayer = useCallback((layer: string) => {
        setVisibleLayers(prev => {
            const next = new Set(prev);
            if (next.has(layer)) next.delete(layer);
            else next.add(layer);
            return next;
        });
    }, []);

    const totalNotes = useMemo(() => {
        if (!seed) return 0;
        return seed.melody.length + seed.bass.length + seed.chords.length + seed.drums.length;
    }, [seed]);

    const patch = useCallback((key: keyof SeedConfig, val: SeedConfig[keyof SeedConfig]) => {
        setConfig(prev => ({ ...prev, [key]: val }));
    }, []);

    return (
        <Card bg="dark" text="white" className="border-0">
            <Card.Body>
                <div className="d-flex align-items-center gap-2 mb-3">
                    <h5 className="mb-0">🎼 MIDI Seed Generator</h5>
                    <Badge bg="info" pill>{t('midiSeed.demo', 'Demo')}</Badge>
                </div>

                <Row className="g-2 mb-3">
                    {/* Root note */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.key', 'Key')}</Form.Label>
                        <Form.Select size="sm" value={config.root} onChange={e => patch("root", Number(e.target.value))}>
                            {NOTE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                        </Form.Select>
                    </Col>

                    {/* Scale */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.scale', 'Scale')}</Form.Label>
                        <Form.Select size="sm" value={config.scale} onChange={e => patch("scale", e.target.value)}>
                            {SCALE_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                    </Col>

                    {/* Tempo */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.tempo', 'Tempo (BPM)')}</Form.Label>
                        <Form.Control type="number" size="sm" min={40} max={240} value={config.tempo} onChange={e => patch("tempo", Number(e.target.value))} />
                    </Col>

                    {/* Bars */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.bars', 'Bars')}</Form.Label>
                        <Form.Control type="number" size="sm" min={1} max={64} value={config.bars} onChange={e => patch("bars", Number(e.target.value))} />
                    </Col>
                </Row>

                <Row className="g-2 mb-3">
                    {/* Progression */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.progression', 'Progression')}</Form.Label>
                        <Form.Select size="sm" value={config.progression} onChange={e => patch("progression", e.target.value)}>
                            {PROGRESSION_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                        </Form.Select>
                    </Col>

                    {/* Drum pattern */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.drums', 'Drums')}</Form.Label>
                        <Form.Select size="sm" value={config.drumPattern} onChange={e => patch("drumPattern", e.target.value)}>
                            {DRUM_PATTERN_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
                        </Form.Select>
                    </Col>

                    {/* Density */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.density', 'Melody density')}: {Math.round(config.density * 100)}%</Form.Label>
                        <Form.Range min={0} max={100} value={config.density * 100} onChange={e => patch("density", Number(e.target.value) / 100)} />
                    </Col>

                    {/* Octave */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.octave', 'Octave')}</Form.Label>
                        <Form.Control type="number" size="sm" min={2} max={6} value={config.octave} onChange={e => patch("octave", Number(e.target.value))} />
                    </Col>
                </Row>

                <Row className="g-2 mb-3">
                    {/* Seed */}
                    <Col xs={6} md={3}>
                        <Form.Label className="small">{t('midiSeed.seed', 'Seed (0 = random)')}</Form.Label>
                        <Form.Control type="number" size="sm" min={0} value={config.seed} onChange={e => patch("seed", Number(e.target.value))} />
                    </Col>
                    <Col xs={6} md={9} className="d-flex align-items-end gap-2">
                        <Button variant="success" size="sm" onClick={handleGenerate}>
                            🎲 {t('midiSeed.generate', 'Generate')}
                        </Button>
                        {seed && onImport && (
                            <OverlayTrigger overlay={<Tooltip>{t('midiSeed.importTooltip', 'Import generated notes to audio editor')}</Tooltip>}>
                                <Button variant="primary" size="sm" onClick={() => onImport(seed)}>
                                    📥 {t('midiSeed.importToEditor', 'Import to editor')}
                                </Button>
                            </OverlayTrigger>
                        )}
                        {seed && (
                            <span className="text-muted small ms-2">
                                {t('midiSeed.notesInLayers', '{{count}} notes in 4 layers', { count: totalNotes })}
                            </span>
                        )}
                    </Col>
                </Row>

                {/* Layer toggles */}
                {seed && (
                    <div className="d-flex gap-2 mb-2">
                        {(["melody", "bass", "chords", "drums"] as const).map(layer => (
                            <Button
                                key={layer}
                                size="sm"
                                variant={visibleLayers.has(layer) ? "light" : "outline-secondary"}
                                onClick={() => toggleLayer(layer)}
                                style={{
                                    fontSize: 12,
                                    borderLeft: `3px solid ${LAYER_COLORS[layer]}`,
                                    opacity: visibleLayers.has(layer) ? 1 : 0.5,
                                }}
                            >
                                {LAYER_LABELS[layer]} ({seed[layer].length})
                            </Button>
                        ))}
                    </div>
                )}

                {/* Mini piano roll preview */}
                {seed && <MiniPianoRoll seed={seed} visibleLayers={visibleLayers} />}

                {/* Stats */}
                {seed && (
                    <div className="mt-2 d-flex gap-3 text-muted small">
                        <span>🎵 {NOTE_NAMES[config.root]} {config.scale}</span>
                        <span>⏱️ {config.tempo} BPM</span>
                        <span>📊 {config.bars} {t('midiSeed.barsUnit', 'bars')}</span>
                        <span>🔑 Seed: {config.seed || t('midiSeed.random', 'random')}</span>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default MidiSeedDemo;
