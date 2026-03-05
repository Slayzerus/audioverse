import React, { useImperativeHandle, useState, useEffect, useRef, Suspense } from "react";
import { useToast } from "../ui/ToastProvider";
import { useTranslation } from 'react-i18next';
import type { OnMount, Monaco } from '@monaco-editor/react';
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));
import { useParseUltrastarMutation, useCreateSongMutation, useUpdateSongMutation, type UltrastarFileData } from "../../scripts/api/apiKaraoke";
import type { KaraokeSongFile } from "../../models/modelsKaraoke";
import { logger } from '../../utils/logger';

const log = logger.scoped('TextTab');

type MonacoEditor = Parameters<OnMount>[0];
type MonacoModel = ReturnType<MonacoEditor['getModel']>;

/** Shape of a parse/validation issue. */
interface ParseIssue {
  line?: number;
  message: string;
}

interface Props {
  ultrastarText: string;
  setUltrastarText: (t: string) => void;
  songId?: number | null;
  setSongId?: (id: number | null) => void;
}

export type TextHandle = {
  save: () => void;
};



const TextTab = React.forwardRef<TextHandle, Props>(({ ultrastarText, setUltrastarText, songId, setSongId }, ref) => {
  const [parsed, setParsed] = useState<KaraokeSongFile | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseIssues, setParseIssues] = useState<Array<{ line?: number; message: string }>>([]);
  const [validationIssues, setValidationIssues] = useState<Array<{ line?: number; message: string }>>([]);
  const parseMut = useParseUltrastarMutation();
  const createMut = useCreateSongMutation();
  const updateMut = useUpdateSongMutation();

  const [autoParse, setAutoParse] = useState<boolean>(true);
  const lastParsedTextRef = useRef<string>('');
  const debounceTimerRef = useRef<number | null>(null);
  const editorMainRef = useRef<MonacoEditor | null>(null);
  const editorPreviewRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const modelRef = useRef<MonacoModel>(null);
  const decorationIdsRefPreview = useRef<string[]>([]);
  const decorationIdsRefMain = useRef<string[]>([]);
  const parseIssuesRef = useRef<typeof parseIssues>([]);
  const validationIssuesRef = useRef<typeof validationIssues>([]);
  const hoverProviderDisposableRef = useRef<{ dispose(): void } | null>(null);
  const mainEditorWrapRef = useRef<HTMLDivElement | null>(null);
  const [quickfixPopup, setQuickfixPopup] = React.useState<{ visible: boolean; top: number; left: number; issue?: ParseIssue; line?: number }>({ visible: false, top: 0, left: 0, issue: undefined });
  const hypherRefs = useRef<{ en?: { hyphenate(word: string): string[] }; pl?: { hyphenate(word: string): string[] } }>({});

  // syllabification helpers that can access hypherRefs
  const vowelClass = 'aeiouyąęóAEIOUYĄĘÓ';
  function simpleSyllabify(word: string) {
    if (!word) return [];
    try {
      const hasPolish = /[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/.test(word);
      const h = hasPolish ? hypherRefs.current.pl : hypherRefs.current.en;
      if (h && typeof h.hyphenate === 'function') {
        const res = h.hyphenate(word);
        if (Array.isArray(res) && res.length > 0) return res;
      }
    } catch (_e) {
      // Expected: hyphenation library may not be loaded or word may be unsupported
    }
    const parts = word.split(new RegExp(`(?=[${vowelClass}])`));
    const syllables: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p) continue;
      if (syllables.length === 0) syllables.push(p);
      else {
        const prev = syllables[syllables.length - 1];
        if (prev.length <= 1) {
          syllables[syllables.length - 1] = prev + p;
        } else {
          syllables.push(p);
        }
      }
    }
    return syllables.filter(Boolean);
  }

  function splitLineBySyllable(line: string) {
    if (!line || line.length < 80) return line;
    const tokens = line.split(/(\s+)/);
    const items = tokens.map(t => ({ text: t, isSpace: /^\s+$/.test(t) }));
    const segments: { text: string; idx: number; tokenIndex: number }[] = [];
    let offset = 0;
    for (let ti = 0; ti < items.length; ti++) {
      const it = items[ti];
      if (it.isSpace) {
        offset += it.text.length;
        continue;
      }
      const sylls = simpleSyllabify(it.text);
      if (sylls.length === 0) {
        segments.push({ text: it.text, idx: offset, tokenIndex: ti });
        offset += it.text.length;
        continue;
      }
      for (const s of sylls) {
        segments.push({ text: s, idx: offset, tokenIndex: ti });
        offset += s.length;
      }
    }
    if (segments.length === 0) return line;
    const mid = Math.floor(line.length / 2);
    let best = segments[0];
    let bestDist = Math.abs(segments[0].idx - mid);
    for (const seg of segments) {
      const d = Math.abs(seg.idx - mid);
      if (d < bestDist) { best = seg; bestDist = d; }
    }
    const insertAt = best.idx + best.text.length;
    return line.slice(0, insertAt) + '\n' + line.slice(insertAt);
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setUltrastarText(ev.target.result as string); };
    reader.readAsText(file, "UTF-8");
  };



  // lazy-load hyphenation library and patterns for English and Polish
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const HypherModule = await import('hypher');
        const Hypher = HypherModule.default || HypherModule;
        const enPatternsModule = await import('hyphenation.en-us');
        const plPatternsModule = await import('hyphenation.pl');
        const enPatterns = enPatternsModule.default || enPatternsModule;
        const plPatterns = plPatternsModule.default || plPatternsModule;
        if (!mounted) return;
        hypherRefs.current.en = new Hypher(enPatterns);
        hypherRefs.current.pl = new Hypher(plPatterns);
      } catch (e) {
        log.warn('hyphenation load failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleParse = async () => {
    setParseError(null);
    setParsed(null);
    setParseIssues([]);
    try {
      const fileData: UltrastarFileData = { fileName: 'upload-ultrastar.txt', data: ultrastarText };
      const res = await parseMut.mutateAsync(fileData);
      setParsed(res);
      // if backend returned an id for saved song, notify parent
      try {
        const maybeId = res?.id ?? (res as unknown as { song?: { id?: number } })?.song?.id;
        if (maybeId && typeof setSongId === 'function') setSongId(maybeId);
      } catch { /* Intentionally swallowed — non-critical operation */ }
      // if server returns structured issues, capture them
      const resAugmented = res as KaraokeSongFile & { errors?: Array<{ line?: number; message?: string }> };
      if (resAugmented.errors && Array.isArray(resAugmented.errors)) {
        setParseIssues(resAugmented.errors.map((e) => ({ line: e.line, message: e.message || String(e) })));
      }
    } catch (err: unknown) {
      log.warn('parse failed', err);
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(msg);
      // try to extract structured errors if present
      try {
        type ErrorWithData = { data?: { errors?: { line?: number; message?: string }[] }; response?: { data?: { errors?: { line?: number; message?: string }[] } } };
        const maybe = (err as ErrorWithData)?.data || (err as ErrorWithData)?.response?.data || (typeof err === 'string' ? JSON.parse(err) : null);
        if (maybe && Array.isArray(maybe.errors)) {
          setParseIssues(maybe.errors.map((e: { line?: number; message?: string }) => ({ line: e.line, message: e.message || String(e) })));
        }
      } catch (_e) {
        // Expected: error object may not contain structured error data
      }
    }
  };

  useEffect(() => {
    if (!autoParse) return;
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      if (!ultrastarText) return;
      if (lastParsedTextRef.current === ultrastarText) return;
      lastParsedTextRef.current = ultrastarText;
      handleParse().catch(e => log.warn('auto-parse failed', e));
    }, 800) as unknown as number;
    return () => { if (debounceTimerRef.current) { window.clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; } };
  }, [ultrastarText, autoParse]);

  // lightweight client-side validation
  useEffect(() => {
    const issues: Array<{ line?: number; message: string }> = [];
    if (!ultrastarText || !ultrastarText.trim()) {
      issues.push({ message: 'Text is empty' });
    } else {
      const lines = ultrastarText.split(/\r?\n/);
      const noteLines = lines.reduce((acc, l, i) => {
        if (/^:\s*/.test(l)) acc.push(i + 1);
        return acc;
      }, [] as number[]);
      if (noteLines.length === 0) {
        issues.push({ message: 'No note lines detected (lines starting with `:`).', line: undefined });
      }
      // detect very long lines that might be accidental
      lines.forEach((l, i) => { if (l.length > 2000) issues.push({ line: i + 1, message: 'Very long line' }); });
    }
    setValidationIssues(issues);
  }, [ultrastarText]);

  const save = () => {
    const blob = new Blob([ultrastarText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultrastar-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    try { localStorage.setItem('audioverse-text-backup', ultrastarText); } catch (e) { log.warn('save text backup failed', e); }
  };

  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleSaveToServer = async () => {
    try {
      let toSave: KaraokeSongFile | null = parsed;
      if (!toSave) {
        const fileData: UltrastarFileData = { fileName: 'upload-ultrastar.txt', data: ultrastarText };
        toSave = await parseMut.mutateAsync(fileData);
        setParsed(toSave);
      }
      if (!toSave) { showToast(t('textTab.nothingToSave'), 'error'); return; }
      if (songId) {
        const res = await updateMut.mutateAsync({ songId, payload: toSave });
        if (res?.id && typeof setSongId === 'function') setSongId(res.id);
        showToast(t('textTab.songUpdated'), 'success');
      } else {
        const res = await createMut.mutateAsync(toSave);
        if (res?.id && typeof setSongId === 'function') setSongId(res.id);
        showToast(t('textTab.songCreated'), 'success');
      }
    } catch (e) {
      log.warn('save to server failed', e);
      showToast(t('textTab.saveFailed'), 'error');
    }
  };

  useImperativeHandle(ref, () => ({ save }));

  const handleMainMount: OnMount = (editor, monaco) => {
    editorMainRef.current = editor;
    monacoRef.current = monaco;
    if (!modelRef.current) {
      modelRef.current = monaco.editor.createModel(ultrastarText || '', 'plaintext');
    }
    editor.setModel(modelRef.current);
    // keep React state in sync when user types in Monaco
    editor.onDidChangeModelContent(() => {
      const v = editor.getValue();
      if (v !== ultrastarText) setUltrastarText(v);
    });
    // enable glyph margin for clickable issue icons
    editor.updateOptions({ glyphMargin: true });
    // click on glyph in main editor should reveal/focus the line
    try {
      editor.onMouseDown((e) => {
        const target = e.target;
        if (!monacoRef.current) return;
        const MouseTargetType = monacoRef.current?.MouseTargetType;
        if (target && MouseTargetType && target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const line = target.position?.lineNumber;
          if (line) jumpToLine(line);
        }
      });
    } catch (_e) {
      // Expected: monaco mouse event API may not be available in all versions
    }

    // register hover provider once when monaco is available
    try {
      if (!hoverProviderDisposableRef.current && monaco) {
        hoverProviderDisposableRef.current = monaco.languages.registerHoverProvider('plaintext', {
          provideHover: (_model: unknown, position: { lineNumber?: number }) => {
            const line = position?.lineNumber;
            if (!line) return null;
            const pi = parseIssuesRef.current.find((p) => p.line === line);
            const vi = validationIssuesRef.current.find((v) => v.line === line);
            const contents: { value: string }[] = [];
            if (pi) contents.push({ value: `**Parse:** ${pi.message}` });
            if (vi) contents.push({ value: `**Validation:** ${vi.message}` });
            if (contents.length === 0) return null;
            return { range: new monaco.Range(line, 1, line, 1), contents };
          }
        });
      }
    } catch (_e) {
      // Expected: monaco hover provider registration may fail in some environments
    }
    // show quickfix popup when hovering issues in the main editor
    try {
      editor.onMouseMove((e) => {
        const pos = e.target.position;
        const line = pos?.lineNumber;
        if (!line) { setQuickfixPopup({ visible: false, top: 0, left: 0 }); return; }
        const pi = parseIssuesRef.current.find((p) => p.line === line);
        const vi = validationIssuesRef.current.find((v) => v.line === line);
        const issue = pi || vi;
        if (!issue) { setQuickfixPopup({ visible: false, top: 0, left: 0 }); return; }
        // position near cursor
        const evt = e.event?.browserEvent ?? window.event;
        const clientX = evt?.clientX || 0;
        const clientY = evt?.clientY || 0;
        const wrap = mainEditorWrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        setQuickfixPopup({ visible: true, top: clientY - rect.top + 6, left: clientX - rect.left + 6, issue, line });
      });
      editor.onMouseLeave(() => setQuickfixPopup({ visible: false, top: 0, left: 0 }));
    } catch (_e) {
      // Expected: monaco mouse event API may not be available in all versions
    }
  };

  const handlePreviewMount: OnMount = (editor, _monaco) => {
    editorPreviewRef.current = editor;
    if (!monacoRef.current) monacoRef.current = _monaco;
    editor.updateOptions({ readOnly: true, minimap: { enabled: false }, lineDecorationsWidth: 16, glyphMargin: true });
    // clicking glyph in preview jumps to main editor line
    try {
      editor.onMouseDown((e) => {
        const target = e.target;
        if (!monacoRef.current) return;
        const MouseTargetType = monacoRef.current?.MouseTargetType;
        if (target && MouseTargetType && target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const line = target.position?.lineNumber;
          if (line) jumpToLine(line);
        }
      });
    } catch (_e) {
      // Expected: monaco mouse event API may not be available in all versions
    }
  };

  // update Monaco decorations when issues change (apply to preview editor)
  useEffect(() => {
    // keep refs in sync for hover provider
    parseIssuesRef.current = parseIssues;
    validationIssuesRef.current = validationIssues;

    const editorPreview = editorPreviewRef.current;
    const editorMain = editorMainRef.current;
    const monaco = monacoRef.current;
    if (!monaco) return;
    const newDecorations: Parameters<MonacoEditor['deltaDecorations']>[1] = [];
    parseIssues.forEach(pi => {
      if (!pi.line) return;
      newDecorations.push({
        range: new monaco.Range(pi.line, 1, pi.line, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-parse-highlight',
          glyphMarginClassName: 'monaco-glyph-parse',
          glyphMarginHoverMessage: { value: pi.message }
        }
      });
    });
    validationIssues.forEach(vi => {
      if (!vi.line) return;
      newDecorations.push({
        range: new monaco.Range(vi.line, 1, vi.line, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-validate-highlight',
          glyphMarginClassName: 'monaco-glyph-validate',
          glyphMarginHoverMessage: { value: vi.message }
        }
      });
    });
    try {
      if (editorPreview) {
        decorationIdsRefPreview.current = editorPreview.deltaDecorations(decorationIdsRefPreview.current || [], newDecorations);
      }
      if (editorMain) {
        decorationIdsRefMain.current = editorMain.deltaDecorations(decorationIdsRefMain.current || [], newDecorations);
      }
    } catch (e) {
      log.warn('failed to set decorations', e);
    }
  }, [parseIssues, validationIssues]);

  // Apply a simple quick-fix for known validation issues
  const applyQuickFix = (issue: ParseIssue, line?: number) => {
    const monaco = monacoRef.current;
    const model = modelRef.current;
    if (!model || !monaco) return;
    try {
      if (issue.message && issue.message.includes('Very long line') && line) {
        const content = model.getLineContent(line) || '';
        const newContent = splitLineBySyllable(content);
        // replace entire line with the new content (may contain a newline)
        const range = new monaco.Range(line, 1, line, content.length + 1);
        model.pushEditOperations([], [{ range, text: newContent }], () => null);
        // reflect into React state
        setUltrastarText(model.getValue());
        // remove that validation issue locally
        const remaining = validationIssuesRef.current.filter((v) => !(v.line === line && v.message === issue.message));
        validationIssuesRef.current = remaining;
        setValidationIssues(remaining);
      } else if (issue.message && issue.message.includes('No note lines') ) {
        // insert a placeholder note line at top
        model.pushEditOperations([], [{ range: new monaco.Range(1, 1, 1, 1), text: ': 0\n' }], () => null);
        setUltrastarText(model.getValue());
        const remaining = validationIssuesRef.current.filter((v) => v !== issue);
        validationIssuesRef.current = remaining;
        setValidationIssues(remaining);
      }
    } catch (e) {
      log.warn('quickfix failed', e);
    }
    setQuickfixPopup({ visible: false, top: 0, left: 0 });
  };

  // ensure model value reflects external changes to ultrastarText
  useEffect(() => {
    const m = modelRef.current;
    if (m && typeof m.getValue === 'function' && m.getValue() !== ultrastarText) {
      m.setValue(ultrastarText || '');
    }
  }, [ultrastarText]);

  const jumpToLine = (line?: number) => {
    if (!line) return;
    const editor = editorMainRef.current;
    const monaco = monacoRef.current;
    try {
      if (editor && typeof editor.revealLineInCenter === 'function') {
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
      } else if (monaco && modelRef.current) {
        // fallback: set cursor on model and focus preview
        const ed = editorMainRef.current;
        ed?.revealLineInCenter(line);
        ed?.setPosition({ lineNumber: line, column: 1 });
        ed?.focus();
      }
    } catch (e) {
      log.warn('jumpToLine failed', e);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <label>{t('textTab.ultrastarFile')} <input type="file" accept=".txt" onChange={handleFile} style={{ marginLeft: 8 }} /></label>
        {(() => {
          const isParsing = parseMut.isPending || (parseMut.status as string) === 'pending';
          return (
            <>
              <button onClick={handleParse} disabled={isParsing || !ultrastarText}>{t('textTab.parseServer')}</button>
              <button onClick={handleSaveToServer} disabled={createMut.isPending || updateMut.isPending || !ultrastarText} style={{ marginLeft: 8 }}>{(createMut.isPending || updateMut.isPending) ? t('textTab.savingButton') : (songId ? t('textTab.saveUpdate') : t('textTab.saveCreate'))}</button>
              {isParsing && <span style={{ marginLeft: 8 }}>{t('textTab.parsing')}</span>}
            </>
          );
        })()}
        {parseError && <span style={{ marginLeft: 8, color: 'crimson' }}>{parseError}</span>}
        {/* show server/client issues summary */}
        {(parseIssues.length > 0 || validationIssues.length > 0) && (
          <div style={{ marginLeft: 12, color: '#a00', fontSize: 13 }}>
            {(parseIssues.length > 0) && (
              <div>
                <div style={{ fontWeight: 600 }}>{t('textTab.parseIssues')}</div>
                {parseIssues.map((pi, idx) => (
                  <div key={idx} style={{ cursor: pi.line ? 'pointer' : 'default', display: 'flex', gap: 8, alignItems: 'center' }} role={pi.line ? 'button' : undefined} tabIndex={pi.line ? 0 : undefined} onClick={() => pi.line && jumpToLine(pi.line)} onKeyDown={(e) => { if (pi.line && e.key === 'Enter') jumpToLine(pi.line); }}>
                    <span className="issue-list-glyph issue-list-glyph-parse" title={pi.message} />
                    <div>{pi.line ? t('textTab.linePrefix', { line: pi.line }) : ''}{pi.message}</div>
                  </div>
                ))}
              </div>
            )}
            {(validationIssues.length > 0) && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 600 }}>{t('textTab.validation')}</div>
                {validationIssues.map((vi, idx) => (
                  <div key={idx} style={{ cursor: vi.line ? 'pointer' : 'default', display: 'flex', gap: 8, alignItems: 'center' }} role={vi.line ? 'button' : undefined} tabIndex={vi.line ? 0 : undefined} onClick={() => vi.line && jumpToLine(vi.line)} onKeyDown={(e) => { if (vi.line && e.key === 'Enter') jumpToLine(vi.line); }}>
                    <span className="issue-list-glyph issue-list-glyph-validate" title={vi.message} />
                    <div>{vi.line ? t('textTab.linePrefix', { line: vi.line }) : ''}{vi.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={autoParse} onChange={e => setAutoParse(e.target.checked)} /> {t('textTab.autoParse')}
          </label>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr minmax(min(280px, 100%), 360px)', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('textTab.fullEditorMain')}</div>
            <div ref={mainEditorWrapRef} style={{ height: 260, border: '1px solid #ddd', position: 'relative' }}>
            <Suspense fallback={<div style={{ padding: 12 }}>{t('textTab.loadingEditor')}</div>}>
              <MonacoEditor
                height="260px"
                defaultLanguage="plaintext"
                value={ultrastarText}
                onChange={(v) => setUltrastarText(v || '')}
                onMount={handleMainMount}
                options={{ minimap: { enabled: false }, wordWrap: 'on', fontFamily: 'monospace' }}
              />
            </Suspense>
              {/* quickfix popup positioned inside editor wrapper */}
              <div
                style={{
                  position: 'absolute',
                  display: quickfixPopup.visible ? 'flex' : 'none',
                  flexDirection: 'row',
                  gap: 8,
                  top: quickfixPopup.top,
                  left: quickfixPopup.left,
                  zIndex: 20
                }}
                className="editor-quickfix-popup"
              >
                <button onClick={() => applyQuickFix(quickfixPopup.issue!, quickfixPopup.line)}>{t('textTab.applyFix')}</button>
                <button onClick={() => { if (quickfixPopup.line) jumpToLine(quickfixPopup.line); setQuickfixPopup({ visible: false, top: 0, left: 0 }); }}>{t('textTab.jump')}</button>
                <button onClick={() => setQuickfixPopup({ visible: false, top: 0, left: 0 })}>{t('common.close')}</button>
              </div>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('textTab.previewReadOnly')}</div>
          <div style={{ height: 260, border: '1px solid #ddd' }}>
            <Suspense fallback={<div style={{ padding: 12 }}>{t('textTab.loadingPreview')}</div>}>
              <MonacoEditor
                height="260px"
                defaultLanguage="plaintext"
                value={ultrastarText}
                onMount={handlePreviewMount}
                options={{ minimap: { enabled: false }, readOnly: true, wordWrap: 'on', fontFamily: 'monospace' }}
              />
            </Suspense>
          </div>
        </div>
      </div>
      
    </div>
  );
});

export default TextTab;
