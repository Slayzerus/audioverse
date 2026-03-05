import React from 'react';
import { useTranslation } from 'react-i18next';

const features = [
  { icon: 'bi-person-badge', titleKey: 'features.player.profiles', fallback: 'Player Profiles', descKey: 'features.player.profilesDesc', descFallback: 'Create and manage player profiles with custom names, colors, and avatars. Quick popup form for new players.' },
  { icon: 'bi-palette2', titleKey: 'features.player.colors', fallback: 'Color Customization', descKey: 'features.player.colorsDesc', descFallback: 'Assign preferred colors to each player with ranked color choices and automatic conflict resolution.' },
  { icon: 'bi-mic-fill', titleKey: 'features.player.microphones', fallback: 'Microphone Support', descKey: 'features.player.microphonesDesc', descFallback: 'Dedicated microphone assignment per player. Automatic device detection with pause on disconnection.' },
  { icon: 'bi-robot', titleKey: 'features.player.aiScoring', fallback: 'AI Scoring', descKey: 'features.player.aiScoringDesc', descFallback: 'Record vocal performances, analyze with AI, and compare against reference tracks for precise pitch and timing feedback.' },
  { icon: 'bi-trophy', titleKey: 'features.player.scoring', fallback: 'Game Scoring', descKey: 'features.player.scoringDesc', descFallback: 'Points, combo bonuses, verse ratings (Awful → Perfect), plus AI jury scores with detailed breakdowns.' },
  { icon: 'bi-bar-chart-line', titleKey: 'features.player.timeline', fallback: 'Visual Timeline', descKey: 'features.player.timelineDesc', descFallback: 'Color-coded player timelines, golden notes, hit animations, synced lyrics with gradient highlights.' },
  { icon: 'bi-stars', titleKey: 'features.player.animations', fallback: 'Hit Animations', descKey: 'features.player.animationsDesc', descFallback: 'Particle effects, combo explosions, alternative animation styles, and visual feedback for every hit.' },
  { icon: 'bi-controller', titleKey: 'features.player.pads', fallback: 'Pad Song Selection', descKey: 'features.player.padsDesc', descFallback: 'Choose songs using game pads with multiple selection modes for an arcade-like experience.' },
];

export const GenericPlayerFeatures: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="mb-5">
      <div className="text-center mb-4">
        <span className="badge bg-success bg-opacity-25 text-success px-3 py-2 mb-2 d-inline-block rounded-pill">
          <i className="bi bi-people me-1" />
          Player System
        </span>
        <h2 className="fw-bold">{t('features.player.heading', 'Multiplayer Karaoke Experience')}</h2>
        <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
          {t('features.player.subtitle', 'Full-featured player management with AI-powered scoring, real-time visuals, and competitive game modes.')}
        </p>
      </div>
      <div className="row g-3">
        {features.map((f, i) => (
          <div key={i} className="col-lg-4 col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3" style={{ width: 44, height: 44, flexShrink: 0 }}>
                    <i className={`bi ${f.icon} text-success fs-5`} />
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
