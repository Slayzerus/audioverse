import React from 'react';
import { useTranslation } from 'react-i18next';

const features = [
  { icon: 'bi-music-note-beamed', titleKey: 'features.karaoke.editor', fallback: 'Karaoke Editor', descKey: 'features.karaoke.editorDesc', descFallback: 'Browse, view, and edit UltraStar karaoke files imported from YouTube with full metadata management.' },
  { icon: 'bi-pencil', titleKey: 'features.karaoke.creation', fallback: 'Song Authoring', descKey: 'features.karaoke.creationDesc', descFallback: 'Create karaoke files from scratch — define lyrics, set timing, mark golden notes, and publish.' },
  { icon: 'bi-link-45deg', titleKey: 'features.karaoke.alignment', fallback: 'Lyric Alignment', descKey: 'features.karaoke.alignmentDesc', descFallback: 'Intelligent text-to-audio synchronization algorithm matching UltraStar accuracy for precise word timing.' },
  { icon: 'bi-easel', titleKey: 'features.karaoke.canvas', fallback: 'Canvas Visualization', descKey: 'features.karaoke.canvasDesc', descFallback: 'Real-time timeline rendered on HTML Canvas with color-coded ranges, golden note indicators, and hit borders.' },
  { icon: 'bi-award', titleKey: 'features.karaoke.scoreScreen', fallback: 'Score Screen', descKey: 'features.karaoke.scoreScreenDesc', descFallback: 'Post-round scoring display with downloadable recordings and combined human + AI score tallies.' },
  { icon: 'bi-type', titleKey: 'features.karaoke.syncText', fallback: 'Synced Lyrics', descKey: 'features.karaoke.syncTextDesc', descFallback: 'Real-time lyric highlighting with gradient position tracking and per-word color synchronization.' },
  { icon: 'bi-gear', titleKey: 'features.karaoke.settings', fallback: 'Game Settings', descKey: 'features.karaoke.settingsDesc', descFallback: 'Themes, fonts, round timers, game modes, and a full KaraokeGame configuration entity.' },
  { icon: 'bi-collection-play', titleKey: 'features.karaoke.playlists', fallback: 'Karaoke Playlists', descKey: 'features.karaoke.playlistsDesc', descFallback: 'Create, share, and save playlists. Browse personal and community playlists, with online sync.' },
];

export const KaraokeManagerFeatures: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="mb-5">
      <div className="text-center mb-4">
        <span className="badge bg-warning bg-opacity-25 text-warning px-3 py-2 mb-2 d-inline-block rounded-pill">
          <i className="bi bi-music-note-beamed me-1" />
          Karaoke Manager
        </span>
        <h2 className="fw-bold">{t('features.karaoke.heading', 'Karaoke Song Management')}</h2>
        <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
          {t('features.karaoke.subtitle', 'Edit, create, and manage karaoke files with UltraStar-compatible timing, canvas visuals, and AI scoring.')}
        </p>
      </div>
      <div className="row g-3">
        {features.map((f, i) => (
          <div key={i} className="col-lg-4 col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center me-3" style={{ width: 44, height: 44, flexShrink: 0 }}>
                    <i className={`bi ${f.icon} text-warning fs-5`} />
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
