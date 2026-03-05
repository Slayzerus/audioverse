import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useToast } from "../ui/ToastProvider";
import AnimatedPerson from "./AnimatedPerson";
import type { CharacterConfig, FeatureConfig } from "./characterTypes";
import { DEFAULT_CHARACTER, VARIANTS } from "./characterTypes";

const KEY = "audioverse.character.config";

/* ---------- helpers ---------- */
function clampPalette(colors: string[]): string[] {
    const c = (colors || []).slice(0, 3);
    if (c.length === 0) c.push("var(--anim-default-black, #000000)");
    while (c.length < 3) c.push(c[c.length - 1]);
    return c;
}

function ColorInputs({
                         value,
                         onChange,
                     }: {
    value: string[];
    onChange: (c: string[]) => void;
}) {
    const base = clampPalette(value);
    const count = Math.min(3, Math.max(1, value?.length ?? 1));
    const view = base.slice(0, count);
    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-2">
                {view.map((col, i) => (
                    <label key={i} className="flex items-center gap-1 text-sm">
                        C{i + 1}
                        <input
                            type="color"
                            value={col}
                            onChange={(e) => {
                                const next = [...view];
                                next[i] = e.target.value;
                                onChange(next);
                            }}
                        />
                    </label>
                ))}
            </div>
            <div className="flex gap-1">
                <button
                    type="button"
                    className="px-2 py-0.5 border rounded text-xs"
                    disabled={count <= 1}
                    onClick={() => onChange(view.slice(0, Math.max(1, count - 1)))}
                >
                    -
                </button>
                <button
                    type="button"
                    className="px-2 py-0.5 border rounded text-xs"
                    disabled={count >= 3}
                    onClick={() =>
                        onChange([...view, view[view.length - 1] || "var(--anim-default-black, #000000)"])
                    }
                >
                    +
                </button>
            </div>
        </div>
    );
}

function Row({
                 title,
                 children,
             }: React.PropsWithChildren<{ title: string }>) {
    return (
        <div className="flex items-start gap-3 py-2 border-b border-gray-200">
            <div className="w-40 font-medium text-sm text-gray-700">{title}</div>
            <div className="flex-1 flex flex-wrap gap-3">{children}</div>
        </div>
    );
}

function FeatureEditor({
                           title,
                           feature,
                           variants,
                           onChange,
                       }: {
    title: string;
    feature: FeatureConfig;
    variants: readonly string[];
    onChange: (f: FeatureConfig) => void;
}) {
    return (
        <Row title={title}>
            <select
                className="px-2 py-1 border rounded"
                value={feature.variant}
                onChange={(e) => onChange({ ...feature, variant: e.target.value })}
            >
                {variants.map((v) => (
                    <option key={v} value={v}>
                        {v}
                    </option>
                ))}
            </select>
            <ColorInputs
                value={feature.colors}
                onChange={(colors) => onChange({ ...feature, colors })}
            />
        </Row>
    );
}

/* ---------- main ---------- */
export default function AnimatedCharacterEditor() {
    const { t } = useTranslation();
    const [json, setJson] = useState<string>("");
    const [cfg, setCfg] = useState<CharacterConfig>(() => {
        try {
            const saved = localStorage.getItem(KEY);
            return saved ? (JSON.parse(saved) as CharacterConfig) : DEFAULT_CHARACTER;
        } catch {
            return DEFAULT_CHARACTER;
        }
    });

    useEffect(() => {
        setJson(JSON.stringify(cfg, null, 2));
        localStorage.setItem(KEY, JSON.stringify(cfg));
    }, [cfg]);

    const { showToast } = useToast();

    const applyJson = () => {
        try {
            const parsed = JSON.parse(json) as CharacterConfig;
            setCfg(parsed);
        } catch {
            showToast(t('characterEditor.invalidJson'), 'error');
        }
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(cfg, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${cfg.name || "character"}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const randomizeColors = () => {
        const rand = () =>
            `#${Math.floor(Math.random() * 0xffffff)
                .toString(16)
                .padStart(6, "0")}`;
        const paint = (f: FeatureConfig): FeatureConfig => ({
            ...f,
            colors: [rand(), rand(), rand()],
        });
        setCfg({
            ...cfg,
            face: paint(cfg.face),
            hair: paint(cfg.hair),
            eyes: paint(cfg.eyes),
            nose: paint(cfg.nose),
            mouth: paint(cfg.mouth),
            outfit: paint(cfg.outfit),
            headwear: paint(cfg.headwear),
            prop: paint(cfg.prop),
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            <div className="space-y-3">
                <Row title={t('characterEditor.name')}>
                    <input
                        className="px-2 py-1 border rounded w-60"
                        value={cfg.name || ""}
                        onChange={(e) => setCfg({ ...cfg, name: e.target.value })}
                        placeholder={t('characterEditor.namePlaceholder')}
                    />
                </Row>

                <Row title={t('characters.size')}>
                    <input
                        type="range"
                        min={140}
                        max={300}
                        value={cfg.size ?? 180}
                        onChange={(e) => setCfg({ ...cfg, size: Number(e.target.value) })}
                    />
                    <div className="text-sm tabular-nums w-16">
                        {cfg.size ?? 180}px
                    </div>
                </Row>

                <FeatureEditor
                    title={t('characters.faceShape')}
                    feature={cfg.face}
                    variants={VARIANTS.face}
                    onChange={(face) => setCfg({ ...cfg, face })}
                />
                <FeatureEditor
                    title={t('characters.hairstyle')}
                    feature={cfg.hair}
                    variants={VARIANTS.hair}
                    onChange={(hair) => setCfg({ ...cfg, hair })}
                />
                <FeatureEditor
                    title={t('characters.eyes')}
                    feature={cfg.eyes}
                    variants={VARIANTS.eyes}
                    onChange={(eyes) => setCfg({ ...cfg, eyes })}
                />
                <FeatureEditor
                    title={t('characters.nose')}
                    feature={cfg.nose}
                    variants={VARIANTS.nose}
                    onChange={(nose) => setCfg({ ...cfg, nose })}
                />
                <FeatureEditor
                    title={t('characters.mouth')}
                    feature={cfg.mouth}
                    variants={VARIANTS.mouth}
                    onChange={(mouth) => setCfg({ ...cfg, mouth })}
                />
                <FeatureEditor
                    title={t('characters.clothing')}
                    feature={cfg.outfit}
                    variants={VARIANTS.outfit}
                    onChange={(outfit) => setCfg({ ...cfg, outfit })}
                />
                <FeatureEditor
                    title={t('characters.headwear')}
                    feature={cfg.headwear}
                    variants={VARIANTS.headwear}
                    onChange={(headwear) => setCfg({ ...cfg, headwear })}
                />
                <FeatureEditor
                    title={t('characters.prop')}
                    feature={cfg.prop}
                    variants={VARIANTS.prop}
                    onChange={(prop) => setCfg({ ...cfg, prop })}
                />

                <div className="flex gap-2 pt-2">
                    <button
                        className="px-3 py-1 bg-gray-100 border rounded"
                        onClick={randomizeColors}
                    >
                        {t('characterEditor.randomizeColors')}
                    </button>
                    <button
                        className="px-3 py-1 bg-gray-100 border rounded"
                        onClick={downloadJson}
                    >
                        {t('characters.downloadJson')}
                    </button>
                </div>

                <div className="pt-4">
                    <div className="text-sm font-semibold mb-1">{t('characterEditor.jsonSection')}</div>
                    <textarea
                        className="w-full h-56 p-2 font-mono text-xs border rounded"
                        value={json}
                        onChange={(e) => setJson(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                            onClick={applyJson}
                        >
                            {t('characterEditor.applyJson')}
                        </button>
                        <button
                            className="px-3 py-1 border rounded"
                            onClick={() =>
                                navigator.clipboard.writeText(JSON.stringify(cfg, null, 2))
                            }
                        >
                            {t('characterEditor.copyToClipboard')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-3">
                <div className="text-sm text-gray-600">{t('characterEditor.preview')}</div>
                <AnimatedPerson character={cfg} score={10} startPose="idle" />
            </div>
        </div>
    );
}
