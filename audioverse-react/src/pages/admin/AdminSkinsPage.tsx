import React, { useEffect, useState, useRef, useCallback, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import styles from "./AdminSkinsPage.module.css";
import {
  ALL_THEMES,
  loadThemeCatalog,
  resetThemeCatalog,
  saveThemeCatalog,
  THEME_VAR_NAMES,
  type ThemeDef,
} from "../../themes";

function getDefaultTheme(): ThemeDef {
  return {
    id: "new-theme-" + Math.random().toString(36).slice(2, 8),
    name: "",
    emoji: "🎨",
    description: "",
    isDark: false,
    vars: Object.fromEntries(THEME_VAR_NAMES.map((v) => [v, "var(--text-primary, #111)"]))
  };
}

const AdminSkinsPage: React.FC = () => {
  const { t } = useTranslation();
  const themeSlug = (th: ThemeDef) => {
    if (!th) return '';
    const id = String(th.id || '');
    if (/^[a-z0-9\-_]+$/i.test(id)) return id.toLowerCase();
    const name = String(th.name || id);
    return name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
  };
  const [themes, setThemes] = useState<ThemeDef[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTheme, setEditTheme] = useState<ThemeDef | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const varInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const modalVarsContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingFocusVarRef = useRef<string | null>(null);

  useEffect(() => {
    setThemes(loadThemeCatalog());
    setLoading(false);
  }, []);

  const handleSave = () => {
    saveThemeCatalog(themes);
    setSaved(t("admin.skins.saved"));
    setTimeout(() => window.location.reload(), 250);
  };

  const handleReset = () => {
    resetThemeCatalog();
    setThemes(ALL_THEMES);
    setSaved(t("admin.skins.reset"));
    setTimeout(() => window.location.reload(), 250);
  };

  const handleEdit = (idx: number) => {
    setEditTheme({ ...themes[idx] });
    setModalOpen(true);
  };

  const handleDelete = (idx: number) => {
    if (window.confirm(t("admin.skins.confirmDelete") || "Delete?")) {
      const newThemes = themes.slice();
      newThemes.splice(idx, 1);
      setThemes(newThemes);
      if (selected >= newThemes.length) setSelected(Math.max(0, newThemes.length - 1));
    }
  };

  const handleAdd = () => {
    setEditTheme(getDefaultTheme());
    setModalOpen(true);
  };

  const handleModalSave = () => {
    if (!editTheme) return;
    const newThemes = themes.slice();
    const idx = themes.findIndex(t => t.id === editTheme.id);
    if (idx >= 0) newThemes[idx] = editTheme;
    else newThemes.push(editTheme);
    setThemes(newThemes);
    setModalOpen(false);
    setEditTheme(null);
  };

  const handleModalChange = (field: keyof ThemeDef, value: ThemeDef[keyof ThemeDef]) => {
    if (!editTheme) return;
    setEditTheme({ ...editTheme, [field]: value });
  };

  const handleModalVarChange = (varName: string, value: string) => {
    if (!editTheme) return;
    setEditTheme({ ...editTheme, vars: { ...editTheme.vars, [varName]: value } });
  };

  // When modal opens (or editTheme changes) and we have a pending var to focus,
  // scroll to and focus its input.
  useEffect(() => {
    if (!modalOpen) return;
    const pending = pendingFocusVarRef.current;
    if (!pending) return;
    setTimeout(() => {
      const el = varInputRefs.current[pending];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
        pendingFocusVarRef.current = null;
        return;
      }
      // fallback: query inside modal container by id
      if (modalVarsContainerRef.current) {
        const node = modalVarsContainerRef.current.querySelector(`#var-${pending}`) as HTMLInputElement | null;
        if (node) {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
          node.focus();
          pendingFocusVarRef.current = null;
        }
      }
    }, 120);
  }, [modalOpen, editTheme]);

  // Show live preview of the theme being edited, otherwise selected
  const theme = modalOpen && editTheme ? editTheme : (themes[selected] || themes[0]);

  /** Shorthand: get a themed var value with fallback */
  const v = useCallback((name: string, fallback = '#888') => theme?.vars[name] || fallback, [theme]);

  /** Click handler for every preview element — opens modal & scrolls to the right variable input */
  const clickVar = useCallback((varName: string) => {
    pendingFocusVarRef.current = varName;
    if (!modalOpen || !editTheme || editTheme.id !== theme.id) {
      setEditTheme({ ...theme });
      setModalOpen(true);
    } else {
      setTimeout(() => {
        const el = varInputRefs.current[varName];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
          pendingFocusVarRef.current = null;
        }
      }, 80);
    }
  }, [modalOpen, editTheme, theme, setEditTheme, setModalOpen]);

  /** Reusable clickable box style */
  const box = useCallback((_varName: string, extra: CSSProperties = {}): CSSProperties => ({
    cursor: 'pointer',
    transition: 'outline 0.15s',
    outline: '2px solid transparent',
    ...extra,
  }), []);

  /** Hover highlight for clickable preview elements */
  const [hoverVar, setHoverVar] = useState<string | null>(null);

  if (loading) {
    return <div className={styles.loading}>{t("common.loading")}</div>;
  }

  return (
    <div className={styles.root}>
      {/* Left: List */}
      <div className={styles.leftPanel}>
        <div className={styles.leftPanelInner}>
          <h1>{t("admin.skins.title")}</h1>
          <p>{t("admin.skins.description")}</p>
          <div className={styles.toolbar}>
            <button onClick={handleSave} className={styles.toolbarBtn}>{t("common.save")}</button>
            <button onClick={handleReset} className={styles.toolbarBtn}>{t("admin.skins.resetButton")}</button>
            <button onClick={handleAdd} className={styles.toolbarBtn}>{t("admin.skins.addButton") || "+"}</button>
            {saved && <span className={styles.savedMsg}>{saved}</span>}
          </div>
          <ul className={styles.themeList}>
            {themes.map((th, idx) => (
              <li key={th.id} className={styles.themeItem}
                style={{
                  background: idx === selected ? "var(--card-bg)" : "var(--bg-secondary)",
                  border: idx === selected ? "2px solid var(--success)" : "1px solid var(--border-secondary)"
                }}
                onClick={() => setSelected(idx)}
              >
                <span className={styles.themeEmoji}>{th.emoji}</span>
                <div className={styles.themeInfo}>
                  <div className={styles.themeName}>{th.name || <span className={styles.themeSecondary}>{t("admin.skins.noName")}</span>}</div>
                  <div className={styles.themeDesc}>{t(`admin.skins.catalog.${themeSlug(th)}.name`, th.name) || <span className={styles.themeSecondary}>{t("admin.skins.noName")}</span>}</div>
                  <div className={styles.themeDesc}>{t(`admin.skins.catalog.${themeSlug(th)}.description`, th.description || '') || <span className={styles.themeTertiary}>{t("admin.skins.noDesc")}</span>}</div>
                  <div className={styles.themeDarkBadge} style={{ color: th.isDark ? "var(--success)" : "var(--accent-primary)" }}>{th.isDark ? t("admin.skins.dark") : t("admin.skins.light")}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleEdit(idx); }} className={styles.editBtn}>{t("common.edit")}</button>
                <button onClick={e => { e.stopPropagation(); handleDelete(idx); }} className={styles.deleteBtn}>{t("common.delete")}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Modal for editing/adding theme */}
        {modalOpen && editTheme && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <h2>{t("admin.skins.editTitle")}</h2>
              <div className={styles.modalForm}>
                <label>
                  {t("admin.skins.field.emoji")}
                  <input type="text" value={editTheme.emoji} maxLength={2} className={styles.emojiInput}
                    onChange={e => handleModalChange("emoji", e.target.value)} />
                </label>
                <label>
                  {t("admin.skins.field.name")}
                  <input type="text" value={editTheme.name} className={styles.nameInput}
                    onChange={e => handleModalChange("name", e.target.value)} />
                </label>
                <label>
                  {t("admin.skins.field.description")}
                  <input type="text" value={editTheme.description || ""} className={styles.descInput}
                    onChange={e => handleModalChange("description", e.target.value)} />
                </label>
                <label>
                  {t("admin.skins.field.isDark")}
                  <input type="checkbox" checked={editTheme.isDark} className={styles.checkboxInput}
                    onChange={e => handleModalChange("isDark", e.target.checked)} />
                </label>
                <div className={styles.varsTitle}>{t("admin.skins.field.vars")}</div>
                <div ref={modalVarsContainerRef} className={styles.varsContainer}>
                  {THEME_VAR_NAMES.map(varName => {
                    const keyName = varName.replace(/^--/, '').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
                    return (
                    <div key={varName} className={styles.varRow}>
                      <span className={styles.varLabel}>
                        {t(`admin.skins.vars.${keyName}.label`, varName)}
                      </span>
                      <input
                        ref={el => { varInputRefs.current[varName] = el; }}
                        id={`var-${varName}`}
                        type="text"
                        value={editTheme.vars[varName] || ""}
                        onChange={e => handleModalVarChange(varName, e.target.value)}
                        className={styles.varTextInput}
                      />
                      <input
                        type="color"
                        value={editTheme.vars[varName]?.match(/^#([0-9a-fA-F]{3,8})$/) ? editTheme.vars[varName] : "#888888"}
                        onChange={e => handleModalVarChange(varName, e.target.value)}
                        className={styles.varColorInput}
                      />
                    </div>
                  )})}
                </div>
                <div className={styles.modalActions}>
                  <button onClick={handleModalSave} className={styles.toolbarBtn}>{t("common.save")}</button>
                  <button onClick={() => { setModalOpen(false); setEditTheme(null); }} className={styles.toolbarBtn}>{t("common.cancel")}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Miniature page preview */}
      <div style={{
        width: "50%", background: v('--bg-primary', '#0a0a0a'), overflow: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* ── Mini Navbar ── */}
        <div
          onClick={() => clickVar('--nav-bg')}
          onMouseEnter={() => setHoverVar('--nav-bg')}
          onMouseLeave={() => setHoverVar(null)}
          style={{
            ...box('--nav-bg', {
              background: v('--nav-bg'),
              display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 10,
              borderBottom: `1px solid ${v('--border-primary')}`,
              outline: hoverVar === '--nav-bg' ? `2px solid ${v('--accent-primary')}` : '2px solid transparent',
            }),
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: v('--nav-text'), letterSpacing: 1 }}>
            Biba<span style={{ color: v('--nav-active') }}>Cafe</span>
          </span>
          <span onClick={e => { e.stopPropagation(); clickVar('--nav-active'); }} style={{ fontSize: 10, fontWeight: 700, color: v('--nav-active'), cursor: 'pointer' }}>Music</span>
          <span onClick={e => { e.stopPropagation(); clickVar('--nav-hover'); }} style={{ fontSize: 10, color: v('--nav-hover'), cursor: 'pointer' }}>Games</span>
          <span onClick={e => { e.stopPropagation(); clickVar('--nav-text'); }} style={{ fontSize: 10, color: v('--nav-text'), cursor: 'pointer' }}>Create</span>
          <div style={{ flex: 1 }} />
          <span onClick={e => { e.stopPropagation(); clickVar('--nav-text'); }} style={{ fontSize: 10, color: v('--nav-text'), cursor: 'pointer' }}>Profile</span>
        </div>

        {/* ── Main content area ── */}
        <div style={{ flex: 1, display: 'flex', padding: 10, gap: 10, minHeight: 0 }}>

          {/* ── Sidebar ── */}
          <div
            onClick={() => clickVar('--bg-secondary')}
            onMouseEnter={() => setHoverVar('--bg-secondary')}
            onMouseLeave={() => setHoverVar(null)}
            style={{
              ...box('--bg-secondary', {
                width: 90, flexShrink: 0,
                background: v('--bg-secondary'),
                borderRadius: 8,
                padding: 8,
                display: 'flex', flexDirection: 'column', gap: 6,
                outline: hoverVar === '--bg-secondary' ? `2px solid ${v('--accent-primary')}` : '2px solid transparent',
              }),
            }}
          >
            {/* Sidebar items — accent, link, text levels */}
            <div onClick={e => { e.stopPropagation(); clickVar('--accent-primary'); }}
              style={{ ...box('--accent-primary'), background: v('--accent-primary'), height: 6, borderRadius: 3, outline: hoverVar === '--accent-primary' ? `2px solid ${v('--nav-active')}` : undefined }}
              onMouseEnter={e => { e.stopPropagation(); setHoverVar('--accent-primary'); }} onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
            />
            <div onClick={e => { e.stopPropagation(); clickVar('--accent-secondary'); }}
              style={{ ...box('--accent-secondary'), background: v('--accent-secondary'), height: 6, borderRadius: 3, outline: hoverVar === '--accent-secondary' ? `2px solid ${v('--nav-active')}` : undefined }}
              onMouseEnter={e => { e.stopPropagation(); setHoverVar('--accent-secondary'); }} onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
            />
            <div onClick={e => { e.stopPropagation(); clickVar('--accent-hover'); }}
              style={{ ...box('--accent-hover'), background: v('--accent-hover'), height: 6, borderRadius: 3, outline: hoverVar === '--accent-hover' ? `2px solid ${v('--nav-active')}` : undefined }}
              onMouseEnter={e => { e.stopPropagation(); setHoverVar('--accent-hover'); }} onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
            />
            <div style={{ height: 4 }} />
            <div onClick={e => { e.stopPropagation(); clickVar('--link-color'); }}
              style={{ fontSize: 9, color: v('--link-color'), textDecoration: 'underline', cursor: 'pointer' }}
            >Link</div>
            <div onClick={e => { e.stopPropagation(); clickVar('--link-hover'); }}
              style={{ fontSize: 9, color: v('--link-hover'), textDecoration: 'underline', cursor: 'pointer' }}
            >Link:hover</div>
            <div style={{ height: 4 }} />
            <div onClick={e => { e.stopPropagation(); clickVar('--text-primary'); }}
              style={{ fontSize: 9, color: v('--text-primary'), cursor: 'pointer' }}>Primary</div>
            <div onClick={e => { e.stopPropagation(); clickVar('--text-secondary'); }}
              style={{ fontSize: 9, color: v('--text-secondary'), cursor: 'pointer' }}>Secondary</div>
            <div onClick={e => { e.stopPropagation(); clickVar('--text-tertiary'); }}
              style={{ fontSize: 9, color: v('--text-tertiary'), cursor: 'pointer' }}>Tertiary</div>
            <div onClick={e => { e.stopPropagation(); clickVar('--text-disabled'); }}
              style={{ fontSize: 9, color: v('--text-disabled'), cursor: 'pointer' }}>Disabled</div>
            <div style={{ flex: 1 }} />
            {/* Scrollbar preview */}
            <div
              onClick={e => { e.stopPropagation(); clickVar('--scrollbar-track'); }}
              onMouseEnter={e => { e.stopPropagation(); setHoverVar('--scrollbar-track'); }}
              onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
              style={{ height: 8, background: v('--scrollbar-track'), borderRadius: 4, position: 'relative', cursor: 'pointer' }}
            >
              <div
                onClick={e => { e.stopPropagation(); clickVar('--scrollbar-thumb'); }}
                onMouseEnter={e => { e.stopPropagation(); setHoverVar('--scrollbar-thumb'); }}
                onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                style={{ position: 'absolute', left: 8, top: 0, width: 28, height: 8, background: v('--scrollbar-thumb'), borderRadius: 4, cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* ── Main content column ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>

            {/* Theme title bar */}
            <div
              onClick={() => clickVar('--bg-tertiary')}
              onMouseEnter={() => setHoverVar('--bg-tertiary')}
              onMouseLeave={() => setHoverVar(null)}
              style={{
                ...box('--bg-tertiary', {
                  background: v('--bg-tertiary'),
                  borderRadius: 6,
                  padding: '6px 10px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  outline: hoverVar === '--bg-tertiary' ? `2px solid ${v('--accent-primary')}` : '2px solid transparent',
                }),
              }}
            >
              <span style={{ fontSize: 20 }}>{theme.emoji}</span>
              <span style={{ color: v('--text-primary'), fontWeight: 700, fontSize: 13 }}>{theme.name || '—'}</span>
              <span style={{ color: v('--text-secondary'), fontSize: 10 }}>{theme.description || ''}</span>
            </div>

            {/* Card with form-like elements */}
            <div
              onClick={() => clickVar('--card-bg')}
              onMouseEnter={() => setHoverVar('--card-bg')}
              onMouseLeave={() => setHoverVar(null)}
              style={{
                ...box('--card-bg', {
                  background: v('--card-bg'),
                  border: `1px solid ${v('--card-border')}`,
                  borderRadius: 8,
                  padding: 10,
                  boxShadow: v('--shadow-md', 'none'),
                  display: 'flex', flexDirection: 'column', gap: 6,
                  outline: hoverVar === '--card-bg' ? `2px solid ${v('--accent-primary')}` : '2px solid transparent',
                }),
              }}
            >
              {/* Mini input row */}
              <div style={{ display: 'flex', gap: 6 }}>
                <div
                  onClick={e => { e.stopPropagation(); clickVar('--input-bg'); }}
                  onMouseEnter={e => { e.stopPropagation(); setHoverVar('--input-bg'); }}
                  onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                  style={{
                    flex: 1, height: 22, borderRadius: 4, cursor: 'pointer',
                    background: v('--input-bg'),
                    border: `1.5px solid ${v('--input-border')}`,
                    display: 'flex', alignItems: 'center', paddingLeft: 6,
                    outline: hoverVar === '--input-bg' ? `2px solid ${v('--accent-primary')}` : undefined,
                  }}
                >
                  <span style={{ fontSize: 9, color: v('--input-text'), opacity: 0.5 }}>Input...</span>
                </div>
                <div
                  onClick={e => { e.stopPropagation(); clickVar('--input-focus-border'); }}
                  onMouseEnter={e => { e.stopPropagation(); setHoverVar('--input-focus-border'); }}
                  onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                  style={{
                    flex: 1, height: 22, borderRadius: 4, cursor: 'pointer',
                    background: v('--input-bg'),
                    border: `2px solid ${v('--input-focus-border')}`,
                    display: 'flex', alignItems: 'center', paddingLeft: 6,
                    outline: hoverVar === '--input-focus-border' ? `2px solid ${v('--accent-primary')}` : undefined,
                  }}
                >
                  <span style={{ fontSize: 9, color: v('--input-text') }}>Focused</span>
                </div>
              </div>

              {/* Buttons row */}
              <div style={{ display: 'flex', gap: 6 }}>
                <div
                  onClick={e => { e.stopPropagation(); clickVar('--btn-bg'); }}
                  onMouseEnter={e => { e.stopPropagation(); setHoverVar('--btn-bg'); }}
                  onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                  style={{
                    ...box('--btn-bg'), display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: v('--btn-bg'), color: v('--btn-text'),
                    border: `1.5px solid ${v('--btn-border')}`,
                    borderRadius: 5, padding: '3px 10px', fontSize: 9, fontWeight: 700,
                    outline: hoverVar === '--btn-bg' ? `2px solid ${v('--accent-primary')}` : undefined,
                  }}
                >Button</div>
                <div
                  onClick={e => { e.stopPropagation(); clickVar('--btn-hover-bg'); }}
                  onMouseEnter={e => { e.stopPropagation(); setHoverVar('--btn-hover-bg'); }}
                  onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                  style={{
                    ...box('--btn-hover-bg'), display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: v('--btn-hover-bg'), color: v('--btn-text'),
                    border: `1.5px solid ${v('--btn-border')}`,
                    borderRadius: 5, padding: '3px 10px', fontSize: 9, fontWeight: 700,
                    outline: hoverVar === '--btn-hover-bg' ? `2px solid ${v('--accent-primary')}` : undefined,
                  }}
                >Hover</div>
              </div>

              {/* Border previews */}
              <div style={{ display: 'flex', gap: 6 }}>
                <div
                  onClick={e => { e.stopPropagation(); clickVar('--border-primary'); }}
                  onMouseEnter={e => { e.stopPropagation(); setHoverVar('--border-primary'); }}
                  onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                  style={{ flex: 1, height: 0, borderTop: `2px solid ${v('--border-primary')}`, cursor: 'pointer' }}
                />
                <div
                  onClick={e => { e.stopPropagation(); clickVar('--border-secondary'); }}
                  onMouseEnter={e => { e.stopPropagation(); setHoverVar('--border-secondary'); }}
                  onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                  style={{ flex: 1, height: 0, borderTop: `2px solid ${v('--border-secondary')}`, cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Dropdown preview */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <div
                onClick={() => clickVar('--dropdown-bg')}
                onMouseEnter={() => setHoverVar('--dropdown-bg')}
                onMouseLeave={() => setHoverVar(null)}
                style={{
                  ...box('--dropdown-bg', {
                    background: v('--dropdown-bg'),
                    borderRadius: 6,
                    padding: '4px 8px',
                    border: `1px solid ${v('--border-primary')}`,
                    display: 'flex', flexDirection: 'column', gap: 2,
                    outline: hoverVar === '--dropdown-bg' ? `2px solid ${v('--accent-primary')}` : '2px solid transparent',
                  }),
                }}
              >
                <span style={{ fontSize: 9, color: v('--dropdown-text') }}>Item 1</span>
                <span
                  onClick={e => { e.stopPropagation(); clickVar('--dropdown-hover-bg'); }}
                  onMouseEnter={e => { e.stopPropagation(); setHoverVar('--dropdown-hover-bg'); }}
                  onMouseLeave={e => { e.stopPropagation(); setHoverVar(null); }}
                  style={{
                    fontSize: 9, color: v('--dropdown-text'),
                    background: v('--dropdown-hover-bg'),
                    borderRadius: 3, padding: '1px 4px', cursor: 'pointer',
                  }}
                >Hovered</span>
                <span style={{ fontSize: 9, color: v('--dropdown-text') }}>Item 3</span>
              </div>

              {/* Elevated bg */}
              <div
                onClick={() => clickVar('--bg-elevated')}
                onMouseEnter={() => setHoverVar('--bg-elevated')}
                onMouseLeave={() => setHoverVar(null)}
                style={{
                  ...box('--bg-elevated', {
                    background: v('--bg-elevated'),
                    borderRadius: 6,
                    padding: '8px 12px',
                    boxShadow: v('--shadow-sm', 'none'),
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    outline: hoverVar === '--bg-elevated' ? `2px solid ${v('--accent-primary')}` : '2px solid transparent',
                  }),
                }}
              >
                <span style={{ fontSize: 9, color: v('--text-secondary') }}>Elevated</span>
              </div>
            </div>

            {/* Status colors row */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['--success', '--warning', '--error', '--info'] as const).map(varName => (
                <div
                  key={varName}
                  onClick={() => clickVar(varName)}
                  onMouseEnter={() => setHoverVar(varName)}
                  onMouseLeave={() => setHoverVar(null)}
                  style={{
                    ...box(varName, {
                      flex: 1, height: 18, borderRadius: 4,
                      background: v(varName),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      outline: hoverVar === varName ? `2px solid ${v('--text-primary')}` : '2px solid transparent',
                    }),
                  }}
                >
                  <span style={{ fontSize: 8, color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {varName.replace('--', '')}
                  </span>
                </div>
              ))}
            </div>

            {/* Shadows row */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['--shadow-sm', '--shadow-md', '--shadow-lg'] as const).map(varName => (
                <div
                  key={varName}
                  onClick={() => clickVar(varName)}
                  onMouseEnter={() => setHoverVar(varName)}
                  onMouseLeave={() => setHoverVar(null)}
                  style={{
                    ...box(varName, {
                      flex: 1, height: 22, borderRadius: 5,
                      background: v('--card-bg'),
                      boxShadow: v(varName, 'none'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      outline: hoverVar === varName ? `2px solid ${v('--accent-primary')}` : '2px solid transparent',
                    }),
                  }}
                >
                  <span style={{ fontSize: 8, color: v('--text-tertiary') }}>
                    {varName.replace('--shadow-', '').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Hint ── */}
        <div style={{ textAlign: 'center', padding: '4px 0 8px', fontSize: 10, color: v('--text-disabled') }}>
          {t('admin.skins.preview.clickHint', 'Click any element to edit its color')}
        </div>
      </div>
    </div>
  );
};

export default AdminSkinsPage;
