import React from 'react';
import { useTranslation } from 'react-i18next';

const features = [
  { icon: 'bi-play-circle', titleKey: 'features.audioEditor.playback', fallback: 'Playback & Transport', descKey: 'features.audioEditor.playbackDesc', descFallback: 'Play, pause, stop, scrub, seek, set BPM, and define loop regions — everything you need for precise audio navigation.' },
  { icon: 'bi-soundwave', titleKey: 'features.audioEditor.timeline', fallback: 'Timeline & Visualization', descKey: 'features.audioEditor.timelineDesc', descFallback: 'Waveform display, zoomable timeline, beat grid, and real-time visualization of your audio.' },
  { icon: 'bi-layers', titleKey: 'features.audioEditor.layers', fallback: 'Layer Management', descKey: 'features.audioEditor.layersDesc', descFallback: 'Stack multiple audio layers, solo/mute tracks, adjust volume and panning per layer.' },
  { icon: 'bi-scissors', titleKey: 'features.audioEditor.clips', fallback: 'Audio Clip Operations', descKey: 'features.audioEditor.clipsDesc', descFallback: 'Cut, copy, paste, trim, split, and fade audio clips with precision.' },
  { icon: 'bi-mic', titleKey: 'features.audioEditor.recording', fallback: 'Recording', descKey: 'features.audioEditor.recordingDesc', descFallback: 'Record from any input device directly into the editor. Multi-take recording with automatic track creation.' },
  { icon: 'bi-sliders', titleKey: 'features.audioEditor.effects', fallback: 'Effects & Processing', descKey: 'features.audioEditor.effectsDesc', descFallback: 'Master EQ, insert effects chain, preset management, wet/dry mix control, and per-effect bypass.' },
  { icon: 'bi-pencil-square', titleKey: 'features.audioEditor.editing', fallback: 'Advanced Editing', descKey: 'features.audioEditor.editingDesc', descFallback: 'Multi-select, ripple editing, quantize-to-grid, time stretching, and full keyboard shortcut support.' },
  { icon: 'bi-music-note-list', titleKey: 'features.audioEditor.midi', fallback: 'MIDI Support', descKey: 'features.audioEditor.midiDesc', descFallback: 'MIDI tracks with piano roll, automation lanes, CC parameter editing, and MIDI import/export.' },
  { icon: 'bi-folder2-open', titleKey: 'features.audioEditor.projects', fallback: 'Project Management', descKey: 'features.audioEditor.projectsDesc', descFallback: 'Auto-save, unlimited undo/redo, project templates, audio import/export, and stem bouncing.' },
  { icon: 'bi-palette', titleKey: 'features.audioEditor.uiux', fallback: 'UI/UX Polish', descKey: 'features.audioEditor.uiuxDesc', descFallback: 'Customizable themes, resizable panels, tooltips, in-app tutorial, and multiple display modes (Fun, Beginner, Mid, Expert, Master).' },
];

export const AudioEditorFeatures: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="mb-5">
      <div className="text-center mb-4">
        <span className="badge bg-primary bg-opacity-25 text-primary px-3 py-2 mb-2 d-inline-block rounded-pill">
          <i className="bi bi-soundwave me-1" />
          Audio Editor
        </span>
        <h2 className="fw-bold">{t('features.audioEditor.heading', 'Professional Audio Editing')}</h2>
        <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
          {t('features.audioEditor.subtitle', 'A full-featured digital audio workstation right in your browser. Record, edit, mix, and master with studio-grade tools.')}
        </p>
      </div>
      <div className="row g-3">
        {features.map((f, i) => (
          <div key={i} className="col-lg-4 col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3" style={{ width: 44, height: 44, flexShrink: 0 }}>
                    <i className={`bi ${f.icon} text-primary fs-5`} />
                  </div>
                  <h6 className="mb-0 fw-semibold">{t(f.titleKey, f.fallback)}</h6>
                </div>
                <p className="text-muted small mb-0">{t(f.descKey, f.descFallback)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
