import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DefaultScoringPresets, DifficultyLevel, ScoringPreset } from "../../constants/karaokeScoringConfig";
import * as apiAdmin from "../../scripts/api/apiAdmin";

const STORAGE_KEY = "karaoke.scoringPresets";
const DIFFICULTIES: DifficultyLevel[] = ["easy", "normal", "hard"];
const FIELDS: { key: keyof ScoringPreset; label: string; type: "number" }[] = [
  { key: "semitoneTolerance", label: "Semitone Tolerance", type: "number" },
  { key: "preWindow", label: "Pre Window (s)", type: "number" },
  { key: "postExtra", label: "Post Extra (s)", type: "number" },
  { key: "difficultyMult", label: "Difficulty Mult", type: "number" },
];

type PresetState = Record<DifficultyLevel, Record<keyof ScoringPreset, number | "">>;

const AdminScoringPresetsPage: React.FC = () => {
  const { t } = useTranslation();
  const [presets, setPresets] = useState<PresetState>(DefaultScoringPresets);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await apiAdmin.getScoringPresets();
        if (!mounted) return;
        if (data && data.presets) {
          // Merge with defaults to ensure all fields
          const merged: PresetState = { ...DefaultScoringPresets };
          for (const diff of DIFFICULTIES) {
            merged[diff] = { ...DefaultScoringPresets[diff], ...(data.presets[diff] || {}) };
          }
          setPresets(merged);
        } else {
          setPresets(DefaultScoringPresets);
        }
      } catch (_e) {
        // fallback to localStorage / defaults
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const merged: PresetState = { ...DefaultScoringPresets };
            for (const diff of DIFFICULTIES) {
              merged[diff] = { ...DefaultScoringPresets[diff], ...(parsed[diff] || {}) };
            }
            setPresets(merged);
          } catch {
            setPresets(DefaultScoringPresets);
          }
        } else {
          setPresets(DefaultScoringPresets);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (diff: DifficultyLevel, field: keyof ScoringPreset, value: string) => {
    const num: number = Number(value);
    let err = "";
    if (value === "" || isNaN(num)) {
      err = "Invalid number";
    } else if (field === "semitoneTolerance" && (num < 0 || !Number.isInteger(num))) {
      err = "Must be integer >= 0";
    } else if ((field === "preWindow" || field === "postExtra") && num < 0) {
      err = "Must be >= 0";
    } else if (field === "difficultyMult" && num <= 0) {
      err = "Must be > 0";
    }
    setErrors((prev) => ({ ...prev, [`${diff}.${field}`]: err }));
    setPresets((prev) => ({
      ...prev,
      [diff]: { ...prev[diff], [field]: value === "" ? "" : num },
    }));
  };

  const hasErrors = Object.values(errors).some((e) => e);

  const handleSave = async () => {
    // Validate all fields before saving
    const newErrors: Record<string, string> = {};
    for (const diff of DIFFICULTIES) {
      for (const { key } of FIELDS) {
        const val = presets[diff][key];
        if (val === "" || val === undefined || val === null || isNaN(val)) {
          newErrors[`${diff}.${key}`] = "Required";
        } else if (key === "semitoneTolerance" && (val < 0 || !Number.isInteger(val))) {
          newErrors[`${diff}.${key}`] = "Must be integer >= 0";
        } else if ((key === "preWindow" || key === "postExtra") && val < 0) {
          newErrors[`${diff}.${key}`] = "Must be >= 0";
        } else if (key === "difficultyMult" && val <= 0) {
          newErrors[`${diff}.${key}`] = "Must be > 0";
        }
      }
    }
    setErrors(newErrors);
    if (Object.values(newErrors).some((e) => e)) {
      setSaved("Please fix errors");
      return;
    }
    try {
      // Try backend save first
      await apiAdmin.setScoringPresets(presets);
      setSaved("Saved to backend");
    } catch (_e) {
      // fallback to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      setSaved("Saved to localStorage (backend unavailable)");
    }
    setTimeout(() => window.location.reload(), 300);
  };

  const handleReset = async () => {
    try {
      // Try backend reset
      try {
        await apiAdmin.setScoringPresets(DefaultScoringPresets);
        setSaved("Reset to defaults (backend)");
      } catch (_e) {
        localStorage.removeItem(STORAGE_KEY);
        setSaved("Reset to defaults (local)");
      }
      setPresets(DefaultScoringPresets);
      setTimeout(() => window.location.reload(), 300);
    } catch (_e) {
      setSaved("Reset failed");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>{t('scoringPresets.loading')}</div>;

  return (
    <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
      <h1>{t('scoringPresets.title')}</h1>
      <p>{t('scoringPresets.description')}</p>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <button onClick={handleSave} style={{ padding: "8px 12px" }} disabled={hasErrors}>{t('scoringPresets.save')}</button>
        <button onClick={handleReset} style={{ padding: "8px 12px" }}>{t('scoringPresets.resetDefaults')}</button>
        {saved && <span style={{ marginLeft: 8 }}>{saved}</span>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600, background: "var(--card-bg, #222)", color: "var(--text-primary, #fff)" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid var(--border-secondary, #444)", padding: 8, background: "var(--card-elevated, #333)" }}>{t('scoringPresets.colDifficulty')}</th>
              {FIELDS.map(f => (
                <th key={f.key} style={{ border: "1px solid var(--border-secondary, #444)", padding: 8, background: "var(--card-elevated, #333)" }}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIFFICULTIES.map(diff => (
              <tr key={diff}>
                <td style={{ border: "1px solid var(--border-secondary, #444)", padding: 8, fontWeight: 600 }}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</td>
                {FIELDS.map(f => (
                  <td key={f.key} style={{ border: "1px solid var(--border-secondary, #444)", padding: 8 }}>
                    <input
                      type="number"
                      value={presets[diff][f.key] ?? ""}
                      min={f.key === "semitoneTolerance" ? 0 : undefined}
                      step={f.key === "semitoneTolerance" ? 1 : "any"}
                      onChange={e => handleChange(diff, f.key, e.target.value)}
                      style={{ width: 90, fontFamily: "inherit", fontSize: 13, background: errors[`${diff}.${f.key}`] ? "var(--error-bg, #400)" : undefined, color: "var(--input-text, #fff)", border: errors[`${diff}.${f.key}`] ? "1.5px solid var(--error, #f55)" : "1px solid var(--border-primary, #555)", borderRadius: 4, padding: 4 }}
                    />
                    {errors[`${diff}.${f.key}`] && (
                      <div style={{ color: "var(--error, #f55)", fontSize: 11 }}>{errors[`${diff}.${f.key}`]}</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Note:</strong> Expected shape is an object with keys "easy", "normal", "hard" and values <code>{'{ semitoneTolerance, preWindow, postExtra, difficultyMult }'}</code>.
      </div>
    </div>
  );
};

export default AdminScoringPresetsPage;
