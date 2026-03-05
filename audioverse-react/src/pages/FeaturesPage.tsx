import React from 'react';
import { AudioEditorFeatures } from '../components/features/AudioEditorFeatures';
import { GenericPlayerFeatures } from '../components/features/GenericPlayerFeatures';
import { KaraokeManagerFeatures } from '../components/features/KaraokeManagerFeatures';
import { useTranslation } from 'react-i18next';

const FeaturesPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      {/* Hero section */}
      <div className="text-center py-5 mb-4" style={{ background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-indigo, #6610f2) 100%)' }}>
        <div className="container">
          <h1 className="display-4 fw-bold text-white mb-3">
            <i className="bi bi-stars me-2" />
            {t('featuresPage.title', 'AudioVerse Features')}
          </h1>
          <p className="lead text-white-50 mx-auto" style={{ maxWidth: 700 }}>
            {t('featuresPage.subtitle', 'Everything you need for karaoke parties, audio production, and multiplayer musical experiences — all in one platform.')}
          </p>
        </div>
      </div>

      {/* Feature sections */}
      <div className="container pb-5">
        <AudioEditorFeatures />
        <GenericPlayerFeatures />
        <KaraokeManagerFeatures />

        {/* CTA */}
        <div className="text-center py-4 mt-3">
          <p className="text-muted">
            {t('featuresPage.cta', 'Ready to get started? Jump into karaoke, create a session, or explore the editor.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
