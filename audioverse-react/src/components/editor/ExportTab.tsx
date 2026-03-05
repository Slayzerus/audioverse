import React, { Suspense, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

interface Props {
  ultrastarText: string;
  audioUrl?: string | null;
  audioFile?: File | null;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  songId?: number | null;
}

import KaraokeEditorManager from './KaraokeEditorManager';
import CollaboratorsPanel from './CollaboratorsPanel';
import VersionHistoryPanel from './VersionHistoryPanel';
import { logger } from '../../utils/logger';
const KaraokePhaserRenderer = React.lazy(() => import('./KaraokePhaserRenderer'));

const log = logger.scoped('ExportTab');

function AdvancedRendererToggle({ ultrastarText, audioUrl, audioRef }: { ultrastarText: string; audioUrl?: string | null; audioRef?: React.RefObject<HTMLAudioElement | null> }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> {t('exportTab.enablePhaser')}
      </label>
      {show && (
        <div style={{ marginTop: 8 }}>
          <Suspense fallback={<div>{t('exportTab.loadingRenderer')}</div>}>
            <KaraokePhaserRenderer ultrastarText={ultrastarText} audioUrl={audioUrl} audioRef={audioRef} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

const ExportTab: React.FC<Props> = ({ ultrastarText, audioUrl, audioFile, audioRef, songId }) => {
  const { t } = useTranslation();
  const STORAGE_KEY = 'audioverse.karaoke.timeline.animationConfig.v1';

  const defaultConfig = {
    enabled: true,
    durationMs: 300,
    translateX: 8,
    scale: 1.01,
    easing: 'cubic-bezier(.22,1,.36,1)',
    opacityInactive: 0.9,
    boxShadow: '0 6px 18px rgba(3,102,214,0.08)',
    scrollSmooth: 0.12,
    scrollEasing: 'easeOutCubic' as 'easeOutCubic' | 'linear',
  };

  const [animationConfig, setAnimationConfig] = useState<{
    enabled: boolean;
    durationMs: number;
    translateX: number;
    scale: number;
    easing: string;
    opacityInactive: number;
    boxShadow: string;
    scrollSmooth: number;
    scrollEasing?: 'easeOutCubic' | 'linear';
  }>(defaultConfig);

  const updateCfg = <K extends keyof typeof animationConfig>(k: K, v: (typeof animationConfig)[K]) =>
    setAnimationConfig(c => { const next = { ...c }; next[k] = v; return next; });

  const presets: Record<string, Partial<typeof defaultConfig>> = {
    Default: {},
    Subtle: { durationMs: 200, translateX: 4, scale: 1.005, opacityInactive: 0.94, scrollSmooth: 0.06 },
    Strong: { durationMs: 420, translateX: 14, scale: 1.06, opacityInactive: 0.82, scrollSmooth: 0.18 },
  };

  const applyPreset = (name: string) => {
    const p = presets[name] ?? {};
    setAnimationConfig(c => ({ ...c, ...p }));
  };

  const resetToDefault = () => setAnimationConfig(defaultConfig);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAnimationConfig(c => ({ ...c, ...parsed }));
      }
    } catch (e) {
      log.warn('Failed to load animationConfig from localStorage', e);
    }
  }, []);

  // persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(animationConfig));
    } catch (e) {
      log.warn('Failed to persist animationConfig to localStorage', e);
    }
  }, [animationConfig]);
  const handleDownloadTxt = () => {
    const blob = new Blob([ultrastarText || '#TITLE:Untitled\nE'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'song.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullBackup = async () => {
    const payload: { ultrastarText: string; savedAt: string; audioFileName?: string; audioDataUrl?: string; audioUrl?: string } = { ultrastarText, savedAt: new Date().toISOString() };
    if (audioFile) {
      try {
        const dataUrl: string = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = (e) => reject(e);
          fr.readAsDataURL(audioFile);
        });
        payload.audioFileName = audioFile.name;
        payload.audioDataUrl = dataUrl;
      } catch (e) {
        log.warn('Failed to read audio file for backup', e);
      }
    } else if (audioUrl) {
      payload.audioUrl = audioUrl;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audioverse-full-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleDownloadTxt} disabled={!ultrastarText}>{t('exportTab.downloadUltrastar')}</button>
        <button onClick={handleDownloadFullBackup} disabled={!ultrastarText}>{t('exportTab.downloadBackup')}</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <b>{t('exportTab.livePreview')}</b>
        <div style={{ marginTop: 8 }}>
          <KaraokeEditorManager ultrastarText={ultrastarText} audioUrl={audioUrl} audioRef={audioRef} animationConfig={animationConfig} />
        </div>
        <div style={{ marginTop: 12, border: '1px solid #eee', padding: 10, borderRadius: 8, background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>{t('exportTab.timelineAnimation')}</b>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select onChange={e => applyPreset(e.target.value)} defaultValue="Default" aria-label={t("editor.export.animPreset", "Animation preset")}>
                <option value="Default">{t('exportTab.presetDefault')}</option>
                <option value="Subtle">{t('exportTab.presetSubtle')}</option>
                <option value="Strong">{t('exportTab.presetStrong')}</option>
              </select>
              <button onClick={resetToDefault}>{t('exportTab.reset')}</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input aria-label="Enable animation" type="checkbox" checked={animationConfig.enabled} onChange={e => updateCfg('enabled', e.target.checked)} />
                {t('exportTab.enabled')}
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(min(140px, 100%), 140px)', gap: 8, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#444' }}>{t('exportTab.durationMs')}</div>
                <input type="range" min={50} max={1000} value={animationConfig.durationMs} onChange={e => updateCfg('durationMs', Number(e.target.value))} style={{ width: '100%' }} aria-label={t("editor.export.duration", "Animation duration")} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <input type="number" value={animationConfig.durationMs} onChange={e => updateCfg('durationMs', Number(e.target.value) || 0)} style={{ width: '100%' }} aria-label={t("editor.export.durationValue", "Duration value")} />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#444' }}>{t('exportTab.translateX')}</div>
                <input type="range" min={0} max={40} value={animationConfig.translateX} onChange={e => updateCfg('translateX', Number(e.target.value))} style={{ width: '100%' }} aria-label={t("editor.export.translateX", "Translate X")} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <input type="number" value={animationConfig.translateX} onChange={e => updateCfg('translateX', Number(e.target.value) || 0)} style={{ width: '100%' }} aria-label={t("editor.export.translateXValue", "Translate X value")} />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#444' }}>{t('exportTab.scale')}</div>
                <input type="range" step={0.01} min={1} max={1.2} value={animationConfig.scale} onChange={e => updateCfg('scale', Number(e.target.value))} style={{ width: '100%' }} aria-label={t("editor.export.scale", "Scale")} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <input step={0.01} type="number" value={animationConfig.scale} onChange={e => updateCfg('scale', Number(e.target.value) || 1)} style={{ width: '100%' }} aria-label={t("editor.export.scaleValue", "Scale value")} />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#444' }}>{t('exportTab.opacityInactive')}</div>
                <input type="range" step={0.01} min={0.5} max={1} value={animationConfig.opacityInactive} onChange={e => updateCfg('opacityInactive', Number(e.target.value))} style={{ width: '100%' }} aria-label={t("editor.export.opacityInactive", "Inactive opacity")} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <input step={0.01} type="number" value={animationConfig.opacityInactive} onChange={e => updateCfg('opacityInactive', Number(e.target.value) || 0)} style={{ width: '100%' }} aria-label={t("editor.export.opacityValue", "Inactive opacity value")} />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#444', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{t('exportTab.scrollSmooth')}</span>
                  <span title={t('exportTab.scrollSmoothTooltip')} style={{ cursor: 'help', color: '#666' }}>ℹ️</span>
                </div>
                <input type="range" step={0.01} min={0} max={1} value={animationConfig.scrollSmooth} onChange={e => updateCfg('scrollSmooth', Number(e.target.value))} style={{ width: '100%' }} aria-label="scroll smooth" />
              </div>
              <div style={{ textAlign: 'right' }}>
                <input step={0.01} type="number" value={animationConfig.scrollSmooth} onChange={e => updateCfg('scrollSmooth', Math.max(0, Math.min(1, Number(e.target.value) || 0)))} style={{ width: '100%' }} aria-label="scroll smooth value" />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#444' }}>{t('exportTab.scrollEasing')}</div>
                <select value={animationConfig.scrollEasing || 'easeOutCubic'} onChange={e => updateCfg('scrollEasing', e.target.value as 'easeOutCubic' | 'linear')} style={{ width: '100%' }} aria-label={t("editor.export.scrollEasing", "Scroll easing")}>
                  <option value="easeOutCubic">easeOutCubic</option>
                  <option value="linear">linear</option>
                </select>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#444', textAlign: 'right' }}> </div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#444' }}>{t('exportTab.easing')}</div>
                  <input type="text" value={animationConfig.easing} onChange={e => updateCfg('easing', e.target.value)} style={{ width: '100%' }} aria-label={t("editor.export.cssEasing", "CSS easing function")} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#444' }}>{t('exportTab.boxShadow')}</div>
                  <input type="text" value={animationConfig.boxShadow} onChange={e => updateCfg('boxShadow', e.target.value)} style={{ width: '100%' }} aria-label={t("editor.export.boxShadow", "Box shadow CSS")} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <AdvancedRendererToggle ultrastarText={ultrastarText} audioUrl={audioUrl} audioRef={audioRef} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <CollaboratorsPanel songId={songId} />
          <VersionHistoryPanel songId={songId} />
        </div>
      </div>
    </div>
  );
};

export default ExportTab;
