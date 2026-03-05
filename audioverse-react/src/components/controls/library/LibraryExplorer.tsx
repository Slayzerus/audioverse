import React from "react";
import { useTranslation } from "react-i18next";

/* ============================== Typy ==================================== */

export type ExplorerVariant = "minimal" | "onlyFiles" | "full";
export type StreamProvider = "tidal" | "spotify" | "youtube";

export interface StreamItem {
    id: string;
    title: string;
    artist?: string;
    provider: StreamProvider;
    url?: string;
}

export interface FileWithPath {
    file: File;
    /** Relative path (e.g. "Album/01 - Intro.wav"). */
    path?: string;
}

export interface LibraryExplorerProps {
    variant?: ExplorerVariant;
    files?: Array<File | FileWithPath>;
    streams?: StreamItem[];
    enableProviders?: Partial<Record<StreamProvider, boolean>>;
    onOpenInEditor?: (file: File) => void;
    onPlayFile?: (file: File) => void;
    onPlayStream?: (item: StreamItem) => void;
    className?: string;
}

/* ======================== Helper: file tree ========================== */

type DirNode = { name: string; dirs: Map<string, DirNode>; files: FileWithPath[] };
const makeDir = (name: string): DirNode => ({ name, dirs: new Map(), files: [] });

const normalizeFiles = (files: Array<File | FileWithPath> | undefined): FileWithPath[] =>
    (files ?? []).map((f) => (f instanceof File ? { file: f } : f));

const pathNormalize = (p: string) => p.replace(/\\/g, "/");

/** Builds a directory tree based on path ("/" or "\") */
const buildTree = (files: FileWithPath[]): DirNode => {
    const root = makeDir("/");
    for (const f of files) {
        const clean = pathNormalize(f.path ?? f.file.name);
        const parts = clean.split("/").filter(Boolean);
        if (parts.length <= 1) {
            root.files.push({ file: f.file, path: parts[0] ?? f.file.name });
            continue;
        }
        let node = root;
        for (let i = 0; i < parts.length - 1; i++) {
            const seg = parts[i]!;
            if (!node.dirs.has(seg)) node.dirs.set(seg, makeDir(seg));
            node = node.dirs.get(seg)!;
        }
        node.files.push({ file: f.file, path: parts[parts.length - 1] ?? f.file.name });
    }
    return root;
};

const flattenFiles = (files: FileWithPath[]): FileWithPath[] =>
    files.slice().sort((a, b) => (a.path ?? a.file.name).localeCompare(b.path ?? b.file.name));

/* ============================ Main component =========================== */

const LibraryExplorer: React.FC<LibraryExplorerProps> = ({
                                                             variant = "full",
                                                             files = [],
                                                             streams = [],
                                                             enableProviders,
                                                             onOpenInEditor,
                                                             onPlayFile,
                                                             onPlayStream,
                                                             className,
                                                         }) => {
    // Hooki WSPÓLNE – zawsze w tej samej kolejności
    const [q, setQ] = React.useState("");
    const normFiles = React.useMemo(() => normalizeFiles(files), [files]);

    const match = React.useCallback(
        (txt: string) => {
            const needle = q.trim().toLowerCase();
            if (!needle) return true;
            return txt.toLowerCase().includes(needle);
        },
        [q]
    );

    const filteredFiles = React.useMemo(
        () =>
            flattenFiles(normFiles).filter((f) =>
                match((f.path ?? f.file.name) + " " + (f.file.type || ""))
            ),
        [normFiles, match]
    );

    const filteredStreams = React.useMemo(
        () => streams.filter((s) => match(`${s.title} ${s.artist ?? ""} ${s.provider}`)),
        [streams, match]
    );

    // Widoki – już jako OSOBNE komponenty (bez dodatkowych hooków tutaj)
    if (variant === "minimal") {
        return (
            <MinimalExplorer
                q={q}
                setQ={setQ}
                files={filteredFiles}
                streams={filteredStreams}
                onOpenInEditor={onOpenInEditor}
                onPlayFile={onPlayFile}
                onPlayStream={onPlayStream}
                className={className}
            />
        );
    }

    if (variant === "onlyFiles") {
        return (
            <OnlyFilesExplorer
                q={q}
                setQ={setQ}
                files={filteredFiles}
                onOpenInEditor={onOpenInEditor}
                onPlayFile={onPlayFile}
                className={className}
            />
        );
    }

    return (
        <FullExplorer
            q={q}
            setQ={setQ}
            normFiles={normFiles}
            filteredStreams={filteredStreams}
            enableProviders={enableProviders}
            onOpenInEditor={onOpenInEditor}
            onPlayFile={onPlayFile}
            onPlayStream={onPlayStream}
            className={className}
        />
    );
};

/* ======================== View sub-components ======================== */

const MinimalExplorer: React.FC<{
    q: string;
    setQ: (s: string) => void;
    files: FileWithPath[];
    streams: StreamItem[];
    onOpenInEditor?: (file: File) => void;
    onPlayFile?: (file: File) => void;
    onPlayStream?: (item: StreamItem) => void;
    className?: string;
}> = ({ q, setQ, files, streams, onOpenInEditor, onPlayFile, onPlayStream, className }) => (
    <div className={"w-full max-w-5xl p-3 space-y-3 " + (className ?? "")}>
        <SearchBox q={q} setQ={setQ} />
        <ResultsList
            files={files}
            streams={streams}
            onOpenInEditor={onOpenInEditor}
            onPlayFile={onPlayFile}
            onPlayStream={onPlayStream}
            showProviders
        />
    </div>
);

const OnlyFilesExplorer: React.FC<{
    q: string;
    setQ: (s: string) => void;
    files: FileWithPath[];
    onOpenInEditor?: (file: File) => void;
    onPlayFile?: (file: File) => void;
    className?: string;
}> = ({ q, setQ, files, onOpenInEditor, onPlayFile, className }) => (
    <div className={"w-full max-w-5xl p-3 space-y-3 " + (className ?? "")}>
        <SearchBox q={q} setQ={setQ} />
        <FilesList files={files} onOpenInEditor={onOpenInEditor} onPlayFile={onPlayFile} />
    </div>
);

const FullExplorer: React.FC<{
    q: string;
    setQ: (s: string) => void;
    normFiles: FileWithPath[];
    filteredStreams: StreamItem[];
    enableProviders?: Partial<Record<StreamProvider, boolean>>;
    onOpenInEditor?: (file: File) => void;
    onPlayFile?: (file: File) => void;
    onPlayStream?: (item: StreamItem) => void;
    className?: string;
}> = ({
          q,
          setQ,
          normFiles,
          filteredStreams,
          enableProviders,
          onOpenInEditor,
          onPlayFile,
          onPlayStream,
          className,
      }) => {
    const { t } = useTranslation();
    const tree = React.useMemo(() => buildTree(normFiles), [normFiles]);
    const [open, setOpen] = React.useState<Record<string, boolean>>({});
    const [activeDir, setActiveDir] = React.useState<string>("/");

    const toggle = (path: string) => setOpen((s) => ({ ...s, [path]: !s[path] }));

    const renderNode = (node: DirNode, path: string): React.ReactNode => {
        const full = path === "/" ? `/${node.name}` : `${path}${node.name}/`;
        const isRoot = path === "/" && node.name === "/";
        const isOpen = open[full] ?? isRoot;

        const children = Array.from(node.dirs.keys()).sort();
        return (
            <div key={full}>
                {!isRoot && (
                    <button
                        onClick={() => {
                            toggle(full);
                            setActiveDir(full);
                        }}
                        className={
                            "flex w-full items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 " +
                            (activeDir === full ? "bg-blue-50" : "")
                        }
                    >
                        <span className="text-xs">{isOpen ? "📂" : "📁"}</span>
                        <span className="text-sm">{node.name}</span>
                    </button>
                )}
                {(isRoot || isOpen) && <div className={!isRoot ? "pl-4" : ""}>{children.map((k) => renderNode(node.dirs.get(k)!, full))}</div>}
            </div>
        );
    };

    const filesInActiveDir = React.useMemo(() => {
        const segments = activeDir.replace(/^\//, "").split("/").filter(Boolean);
        let node = tree;
        for (const seg of segments) {
            const next = node.dirs.get(seg);
            if (!next) return [] as FileWithPath[];
            node = next;
        }
        const filesHere = flattenFiles(node.files);
        return q ? filesHere.filter((f) => (f.path ?? f.file.name).toLowerCase().includes(q.toLowerCase())) : filesHere;
    }, [activeDir, tree, q]);

    const providersEnabled = {
        tidal: enableProviders?.tidal ?? true,
        spotify: enableProviders?.spotify ?? true,
        youtube: enableProviders?.youtube ?? true,
    };

    return (
        <div className={"grid grid-cols-12 gap-3 " + (className ?? "")}>
            {/* Sidebar (drzewo) */}
            <div className="col-span-4 lg:col-span-3 xl:col-span-3 border rounded-xl p-2 bg-white">
                <div className="px-2 pb-2 text-xs font-semibold text-gray-500">{t('libraryExplorer.library', 'Library')}</div>
                <div className="space-y-1">{renderNode(tree, "/")}</div>

                <div className="mt-4 border-t pt-2">
                    <div className="px-2 pb-1 text-xs font-semibold text-gray-500">{t('libraryExplorer.streaming', 'Streaming')}</div>
                    <ProviderToggle name="Tidal" enabled={providersEnabled.tidal} />
                    <ProviderToggle name="Spotify" enabled={providersEnabled.spotify} />
                    <ProviderToggle name="YouTube" enabled={providersEnabled.youtube} />
                </div>
            </div>

            {/* Content */}
            <div className="col-span-8 lg:col-span-9 xl:col-span-9 space-y-3">
                <SearchBox q={q} setQ={setQ} />
                <FilesList files={filesInActiveDir} onOpenInEditor={onOpenInEditor} onPlayFile={onPlayFile} />
                {(providersEnabled.tidal || providersEnabled.spotify || providersEnabled.youtube) && (
                    <ResultsStreams
                        streams={filteredStreams.filter((s) => providersEnabled[s.provider])}
                        onPlayStream={onPlayStream}
                    />
                )}
            </div>
        </div>
    );
};

/* =========================== Pod-komponenty UI =========================== */

const SearchBox: React.FC<{ q: string; setQ: (s: string) => void }> = ({ q, setQ }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-2">
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('libraryExplorer.searchPlaceholder', 'Search...')}
                aria-label={t('libraryExplorer.searchLibrary', 'Search library')}
                className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            {q && (
                <button onClick={() => setQ("")} className="text-sm text-gray-500 hover:text-gray-700" title={t('libraryExplorer.clear', 'Clear')}>
                    ✕
                </button>
            )}
        </div>
    );
};

const FilesList: React.FC<{
    files: FileWithPath[];
    onOpenInEditor?: (file: File) => void;
    onPlayFile?: (file: File) => void;
}> = ({ files, onOpenInEditor, onPlayFile }) => {
    const { t } = useTranslation();
    if (!files.length) {
        return <div className="text-sm text-gray-500">{t('libraryExplorer.noFiles')}</div>;
    }
    return (
        <div className="rounded-xl border bg-white">
            <table className="w-full text-sm">
                <thead>
                <tr className="[&>th]:text-left [&>th]:font-semibold [&>th]:px-3 [&>th]:py-2 text-gray-600">
                    <th>{t('libraryExplorer.colFile')}</th>
                    <th className="hidden sm:table-cell">{t('libraryExplorer.colType')}</th>
                    <th className="w-40">{t('libraryExplorer.colActions')}</th>
                </tr>
                </thead>
                <tbody>
                {files.map((f) => {
                    const name = f.path ?? f.file.name;
                    return (
                        <tr key={name} className="[&>td]:px-3 [&>td]:py-2 border-t">
                            <td className="truncate">{name}</td>
                            <td className="hidden sm:table-cell text-gray-500">{f.file.type || "—"}</td>
                            <td className="flex gap-2">
                                <button
                                    className="px-2 py-1 border rounded-lg bg-white hover:bg-gray-50"
                                    onClick={() => onOpenInEditor?.(f.file)}
                                    title={t('libraryExplorer.openInEditor', 'Open in Editor')}
                                >
                                    ✎ {t('libraryExplorer.openInEditor', 'Open in Editor')}
                                </button>
                                <button
                                    className="px-2 py-1 border rounded-lg bg-white hover:bg-gray-50"
                                    onClick={() => onPlayFile?.(f.file)}
                                    title={t('libraryExplorer.play', 'Play')}
                                >
                                    ▶ {t('libraryExplorer.play', 'Play')}
                                </button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

const ResultsStreams: React.FC<{
    streams: StreamItem[];
    onPlayStream?: (item: StreamItem) => void;
}> = ({ streams, onPlayStream }) => {
    const { t } = useTranslation();
    if (!streams.length) return null;
    const icon = (p: StreamProvider): string => (p === "tidal" ? "\ud83c\udf0a" : p === "spotify" ? "\ud83d\udfe2" : "\u25b6\ufe0f");
    return (
        <div className="rounded-xl border bg-white">
            <div className="px-3 py-2 text-sm font-semibold text-gray-600">{t('libraryExplorer.streaming', 'Streaming')}</div>
            <ul>
                {streams.map((s) => (
                    <li key={`${s.provider}:${s.id}`} className="flex items-center justify-between border-t px-3 py-2">
                        <div className="min-w-0">
                            <div className="truncate">{s.title}</div>
                            <div className="text-xs text-gray-500 truncate">
                                {icon(s.provider)} {s.provider.toUpperCase()}
                                {s.artist ? ` \u2022 ${s.artist}` : ""}
                            </div>
                        </div>
                        <button className="px-2 py-1 border rounded-lg bg-white hover:bg-gray-50" onClick={() => onPlayStream?.(s)}>
                            \u25b6 {t('libraryExplorer.play', 'Play')}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ResultsList: React.FC<{
    files: FileWithPath[];
    streams: StreamItem[];
    onOpenInEditor?: (file: File) => void;
    onPlayFile?: (file: File) => void;
    onPlayStream?: (item: StreamItem) => void;
    showProviders?: boolean;
}> = ({ files, streams, onOpenInEditor, onPlayFile, onPlayStream, showProviders }) => (
    <div className="space-y-3">
        <FilesList files={files} onOpenInEditor={onOpenInEditor} onPlayFile={onPlayFile} />
        {showProviders && <ResultsStreams streams={streams} onPlayStream={onPlayStream} />}
    </div>
);

const ProviderToggle: React.FC<{ name: string; enabled: boolean }> = ({ name, enabled }) => (
    <div className="flex items-center gap-2 px-2 py-1 text-sm">
        <span className="inline-flex h-2 w-2 rounded-full" style={{ background: enabled ? "var(--success, #10b981)" : "var(--border-light, #d1d5db)" }} />
        <span className={enabled ? "" : "text-gray-400"}>{name}</span>
    </div>
);

export default LibraryExplorer;
