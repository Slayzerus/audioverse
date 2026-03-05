import React, { useEffect, useState, useMemo } from "react";
import "./ThesisPage.css";

/* ─────────────────────────── types & constants ──────────────────────────── */

interface TocEntry { id: string; level: number; text: string; }

const CHAPTERS = [1, 2, 3, 4, 5] as const;
const chapterFile = (n: number) =>
    `/thesis/Gra wokalna karaoke z wykorzystaniem sztucznej inteligencji - ${n}.txt`;

/**
 * Map: Rysunek X.Y → graphics file number (001–030).
 * Order matches the blockquote captions across all 5 chapters.
 */
const FIGURE_MAP: Record<string, string> = {
    "1.1": "001",
    "2.1": "002", "2.2": "003", "2.3": "017", "2.4": "018", "2.5": "019",
    "3.1": "004", "3.2": "005", "3.3": "020",
    "4.1": "006", "4.2": "007", "4.3": "008", "4.4": "009", "4.5": "010",
    "4.6": "011", "4.7": "012", "4.8": "021", "4.9": "022", "4.10": "023",
    "4.11": "024", "4.12": "025", "4.13": "026", "4.14": "027", "4.15": "028",
    "5.1": "013", "5.2": "014", "5.3": "015", "5.4": "016", "5.5": "029",
    "5.6": "030",
};

/* ───────────────────────────── helpers ───────────────────────────────────── */

/** Convert Markdown-ish inline formatting to React nodes */
function renderInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // pattern: bold-italic, bold, italic, inline-code, inline-math, citations
    const re = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\$([^$]+?)\$)|(\[(\d{1,3})\])/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) nodes.push(text.slice(last, m.index));
        if (m[2])       nodes.push(<strong key={key}><em>{m[2]}</em></strong>);
        else if (m[4])  nodes.push(<strong key={key}>{m[4]}</strong>);
        else if (m[6])  nodes.push(<em key={key}>{m[6]}</em>);
        else if (m[8])  nodes.push(<code key={key} className="thesis-code">{m[8]}</code>);
        else if (m[10]) nodes.push(<span key={key} className="thesis-math">{m[10]}</span>);
        else if (m[12]) nodes.push(<sup key={key} className="thesis-cite">[{m[12]}]</sup>);
        key++;
        last = m.index + m[0].length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

/* ───────────────────────────── parser ────────────────────────────────────── */

type Block =
    | { type: "h1"; text: string; id: string }
    | { type: "h2"; text: string; id: string }
    | { type: "h3"; text: string; id: string }
    | { type: "para"; text: string }
    | { type: "code"; lang: string; lines: string[] }
    | { type: "table"; rows: string[][] }
    | { type: "figure"; num: string; caption: string }
    | { type: "blockquote"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "math"; text: string }
    | { type: "hr" };

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^\w\sąćęłńóśźż-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);
}

function parseChapter(raw: string): Block[] {
    const lines = raw.split("\n");
    const blocks: Block[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const s = line.trim();

        if (!s) { i++; continue; }

        // code block
        if (s.startsWith("```")) {
            const lang = s.slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            if (i < lines.length) i++;
            blocks.push({ type: "code", lang, lines: codeLines });
            continue;
        }

        // headings
        if (s.startsWith("# ")) {
            const text = s.slice(2).replace(/\*+/g, "").trim();
            blocks.push({ type: "h1", text, id: slugify(text) });
            i++; continue;
        }
        if (s.startsWith("## ")) {
            const text = s.slice(3).replace(/\*+/g, "").trim();
            blocks.push({ type: "h2", text, id: slugify(text) });
            i++; continue;
        }
        if (s.startsWith("### ")) {
            const text = s.slice(4).replace(/\*+/g, "").trim();
            blocks.push({ type: "h3", text, id: slugify(text) });
            i++; continue;
        }

        // display math $$...$$
        if (s.startsWith("$$") && s.endsWith("$$") && s.length > 4) {
            blocks.push({ type: "math", text: s.slice(2, -2).trim() });
            i++; continue;
        }
        if (s === "$$") {
            const mathLines: string[] = [];
            i++;
            while (i < lines.length && lines[i].trim() !== "$$") {
                mathLines.push(lines[i].trim());
                i++;
            }
            if (i < lines.length) i++;
            blocks.push({ type: "math", text: mathLines.join("\n") });
            continue;
        }

        // table
        if (s.startsWith("|")) {
            const tLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
                tLines.push(lines[i]);
                i++;
            }
            const dataLines = tLines.filter(l => !/^\|[\s\-:|]+\|$/.test(l.trim()));
            const rows = dataLines.map(l =>
                l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim())
            );
            blocks.push({ type: "table", rows });
            continue;
        }

        // blockquote → figure detection
        if (s.startsWith("> ")) {
            const parts: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith("> ")) {
                parts.push(lines[i].trim().slice(2));
                i++;
            }
            const full = parts.join(" ");
            const figMatch = full.match(/\*\*Rysunek\s+(\d+\.\d+)\*\*/);
            if (figMatch) {
                blocks.push({ type: "figure", num: figMatch[1], caption: full.replace(/\*\*/g, "") });
            } else {
                blocks.push({ type: "blockquote", text: full });
            }
            continue;
        }

        // ordered list
        if (/^\d+\.\s+/.test(s)) {
            const items: string[] = [];
            while (i < lines.length) {
                const m = lines[i].trim().match(/^\d+\.\s+(.+)/);
                if (m) {
                    items.push(m[1]);
                    i++;
                    // continuation lines
                    while (i < lines.length && lines[i].match(/^[\s\t]+\S/) && !lines[i].trim().match(/^\d+\.\s/)) {
                        items[items.length - 1] += " " + lines[i].trim();
                        i++;
                    }
                } else break;
            }
            blocks.push({ type: "ol", items });
            continue;
        }

        // bullet list
        if (/^[-*]\s+/.test(s)) {
            const items: string[] = [];
            while (i < lines.length) {
                const m = lines[i].trim().match(/^[-*]\s+(.+)/);
                if (m) {
                    items.push(m[1]);
                    i++;
                    while (i < lines.length && lines[i].match(/^[\s\t]+\S/) && !lines[i].trim().match(/^[-*]\s/)) {
                        items[items.length - 1] += " " + lines[i].trim();
                        i++;
                    }
                } else break;
            }
            blocks.push({ type: "ul", items });
            continue;
        }

        // horizontal rule
        if (/^-{3,}$/.test(s)) { blocks.push({ type: "hr" }); i++; continue; }

        // paragraph (accumulate contiguous non-special lines)
        const parts: string[] = [];
        while (i < lines.length) {
            const cs = lines[i].trim();
            if (!cs || /^#{1,3}\s/.test(cs) || cs.startsWith("|") || cs.startsWith("```")
                || cs.startsWith("> ") || /^[-*]\s/.test(cs) || /^\d+\.\s/.test(cs)
                || /^-{3,}$/.test(cs) || cs.startsWith("$$")) break;
            parts.push(cs);
            i++;
        }
        if (parts.length) {
            blocks.push({ type: "para", text: parts.join(" ") });
        } else {
            i++; // safety
        }
    }
    return blocks;
}

/* ───────────────────────── block renderer ────────────────────────────────── */

function BlockRenderer({ block }: { block: Block }) {
    switch (block.type) {
        case "h1": return <h2 id={block.id} className="thesis-h1">{renderInline(block.text)}</h2>;
        case "h2": return <h3 id={block.id} className="thesis-h2">{renderInline(block.text)}</h3>;
        case "h3": return <h4 id={block.id} className="thesis-h3">{renderInline(block.text)}</h4>;
        case "para": return <p className="thesis-p">{renderInline(block.text)}</p>;
        case "hr": return <hr className="thesis-hr" />;
        case "math":
            return (
                <div className="thesis-math-block">
                    {block.text.split("\n").map((l, i) => <div key={i}>{l}</div>)}
                </div>
            );
        case "code":
            return (
                <pre className="thesis-pre">
                    <code>{block.lines.join("\n")}</code>
                </pre>
            );
        case "table":
            return (
                <div className="thesis-table-wrap">
                    <table className="thesis-table">
                        <thead>
                            <tr>{block.rows[0]?.map((c, ci) => <th key={ci}>{renderInline(c)}</th>)}</tr>
                        </thead>
                        <tbody>
                            {block.rows.slice(1).map((row, ri) => (
                                <tr key={ri}>{row.map((c, ci) => <td key={ci}>{renderInline(c)}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        case "figure": {
            const file = FIGURE_MAP[block.num];
            const imgSrc = file ? `/thesis/graphics/${file}.png` : undefined;
            return (
                <figure className="thesis-figure">
                    {imgSrc ? (
                        <img src={imgSrc} alt={`Rysunek ${block.num}`} className="thesis-fig-img"
                             onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : null}
                    <figcaption className="thesis-figcaption">
                        <strong>Rysunek {block.num}</strong> — {renderInline(block.caption.replace(/^Rysunek\s+\d+\.\d+\s*—?\s*/, ""))}
                    </figcaption>
                </figure>
            );
        }
        case "blockquote":
            return <blockquote className="thesis-blockquote">{renderInline(block.text)}</blockquote>;
        case "ul":
            return <ul className="thesis-ul">{block.items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}</ul>;
        case "ol":
            return <ol className="thesis-ol">{block.items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}</ol>;
        default: return null;
    }
}

/* ──────────────────── Table of Contents (sidebar) ───────────────────────── */

function buildToc(allBlocks: Block[]): TocEntry[] {
    const entries: TocEntry[] = [];
    for (const b of allBlocks) {
        if (b.type === "h1") entries.push({ id: b.id, level: 1, text: b.text });
        else if (b.type === "h2") entries.push({ id: b.id, level: 2, text: b.text });
        else if (b.type === "h3") entries.push({ id: b.id, level: 3, text: b.text });
    }
    return entries;
}

function TocSidebar({ toc, activeId }: { toc: TocEntry[]; activeId: string }) {
    return (
        <nav className="thesis-toc">
            <h5 className="thesis-toc-title">Spis treści</h5>
            <ul className="thesis-toc-list">
                {toc.map(e => (
                    <li key={e.id}
                        className={`thesis-toc-item thesis-toc-l${e.level}${activeId === e.id ? " active" : ""}`}>
                        <a href={`#${e.id}`}>{e.text}</a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

/* ─────────────────────────── main page ──────────────────────────────────── */

export default function ThesisPage() {
    const [chapters, setChapters] = useState<Block[][]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState("");

    // load chapter files
    useEffect(() => {
        Promise.all(CHAPTERS.map(n =>
            fetch(chapterFile(n)).then(r => r.text()).then(parseChapter)
        )).then(parsed => {
            setChapters(parsed);
            setLoading(false);
        });
    }, []);

    const allBlocks = useMemo(() => chapters.flat(), [chapters]);
    const toc = useMemo(() => buildToc(allBlocks), [allBlocks]);

    // intersection observer for active heading
    useEffect(() => {
        if (!toc.length) return;
        const observer = new IntersectionObserver(
            entries => {
                for (const e of entries) {
                    if (e.isIntersecting) { setActiveId(e.target.id); break; }
                }
            },
            { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 },
        );
        for (const t of toc) {
            const el = document.getElementById(t.id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, [toc]);

    const handleDownloadDocx = () => {
        const a = document.createElement("a");
        a.href = "/thesis/Gra wokalna karaoke z wykorzystaniem sztucznej inteligencji.docx";
        a.download = "Gra wokalna karaoke z wykorzystaniem sztucznej inteligencji.docx";
        a.click();
    };

    if (loading) {
        return (
            <div className="thesis-loading">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-3">Loading thesis…</p>
            </div>
        );
    }

    return (
        <div className="thesis-layout">
            {/* Sidebar */}
            <aside className="thesis-sidebar">
                <TocSidebar toc={toc} activeId={activeId} />
                <button className="btn btn-primary thesis-download-btn" onClick={handleDownloadDocx}>
                    <i className="bi bi-file-earmark-word me-2" />
                    Download .docx
                </button>
            </aside>

            {/* Main content */}
            <main className="thesis-main">
                {/* Title */}
                <header className="thesis-header">
                    <h1 className="thesis-title">
                        Gra wokalna karaoke<br />
                        z wykorzystaniem sztucznej inteligencji
                    </h1>
                    <p className="thesis-subtitle">Engineering thesis</p>
                    <div className="thesis-actions">
                        <button className="btn btn-outline-primary btn-sm" onClick={handleDownloadDocx}>
                            <i className="bi bi-download me-1" />
                            Download DOCX
                        </button>
                    </div>
                </header>

                {/* Rendered chapters */}
                {allBlocks.map((block, idx) => (
                    <BlockRenderer key={idx} block={block} />
                ))}
            </main>
        </div>
    );
}
