// WikiContent.tsx — Displays a wiki page: breadcrumbs, markdown content, children, revisions
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  useWikiPageQuery,
  useWikiRevisionsQuery,
  useWikiRevisionQuery,
} from "../../scripts/api/apiWiki";
import type { WikiRevisionListDto } from "../../models/modelsWiki";

interface WikiContentProps {
  slug: string;
}

const WikiContent: React.FC<WikiContentProps> = ({ slug }) => {
  const { data: page, isLoading, error } = useWikiPageQuery(slug);
  const [showRevisions, setShowRevisions] = useState(false);
  const [selectedRev, setSelectedRev] = useState<number | null>(null);

  const { data: revisions } = useWikiRevisionsQuery(showRevisions ? page?.id : undefined);
  const { data: revisionSnapshot } = useWikiRevisionQuery(
    selectedRev ? page?.id : undefined,
    selectedRev ?? undefined,
  );

  const htmlContent = useMemo(() => {
    const md = revisionSnapshot?.contentMarkdown ?? page?.contentMarkdown ?? "";
    const raw = marked.parse(md, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [page?.contentMarkdown, revisionSnapshot?.contentMarkdown]);

  if (isLoading) return <div className="text-muted p-4">Loading page...</div>;
  if (error || !page) return <div className="text-danger p-4">Page not found.</div>;

  return (
    <article className="flex-grow-1" style={{ minWidth: 0 }}>
      {/* Breadcrumbs */}
      {page.breadcrumbs && page.breadcrumbs.length > 0 && (
        <nav aria-label="breadcrumb" className="mb-2">
          <ol className="breadcrumb small mb-1">
            <li className="breadcrumb-item">
              <Link to="/wiki">Wiki</Link>
            </li>
            {page.breadcrumbs.map((crumb, i) => {
              const isLast = i === page.breadcrumbs!.length - 1;
              return (
                <li key={crumb.slug} className={`breadcrumb-item ${isLast ? "active" : ""}`}>
                  {isLast ? crumb.title : <Link to={`/wiki/${crumb.slug}`}>{crumb.title}</Link>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Page title */}
      <h1 className="mb-3">
        {page.icon && <i className={`bi bi-${page.icon} me-2 opacity-50`} />}
        {revisionSnapshot ? `${page.title} (rev ${revisionSnapshot.revisionNumber})` : page.title}
      </h1>

      {/* Tags */}
      {page.tags && (
        <div className="mb-3">
          {page.tags.split(",").map(tag => (
            <span key={tag.trim()} className="badge bg-secondary me-1">{tag.trim()}</span>
          ))}
        </div>
      )}

      {/* Markdown content */}
      <div
        className="wiki-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Children links */}
      {page.children && page.children.length > 0 && (
        <div className="mt-4 pt-3 border-top">
          <h5>Subpages</h5>
          <div className="list-group">
            {page.children.map(child => (
              <Link
                key={child.id}
                to={`/wiki/${child.slug}`}
                className="list-group-item list-group-item-action d-flex align-items-center"
              >
                {child.icon && <i className={`bi bi-${child.icon} me-2 opacity-50`} />}
                {child.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Revision history toggle */}
      <div className="mt-4 pt-3 border-top">
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => { setShowRevisions(!showRevisions); setSelectedRev(null); }}
          >
            <i className="bi bi-clock-history me-1" />
            {showRevisions ? "Hide history" : "Show history"}
          </button>
          {selectedRev && (
            <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedRev(null)}>
              Back to current
            </button>
          )}
          <span className="text-muted small ms-auto">
            Updated {new Date(page.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {showRevisions && revisions && (
          <RevisionList revisions={revisions} selectedRev={selectedRev} onSelect={setSelectedRev} />
        )}
      </div>
    </article>
  );
};

function RevisionList({
  revisions,
  selectedRev,
  onSelect,
}: {
  revisions: WikiRevisionListDto[];
  selectedRev: number | null;
  onSelect: (rev: number) => void;
}) {
  return (
    <div className="mt-2">
      <table className="table table-sm table-striped small">
        <thead>
          <tr>
            <th>#</th>
            <th>Summary</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {revisions.map(r => (
            <tr key={r.id} className={selectedRev === r.revisionNumber ? "table-primary" : ""}>
              <td>{r.revisionNumber}</td>
              <td>{r.editSummary ?? <span className="text-muted">—</span>}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>
                <button
                  className="btn btn-sm btn-link p-0"
                  onClick={() => onSelect(r.revisionNumber)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WikiContent;
