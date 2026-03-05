// WikiSearchResults.tsx — Displays search results for wiki
import React from "react";
import { Link } from "react-router-dom";
import { useWikiSearchQuery } from "../../scripts/api/apiWiki";

interface WikiSearchResultsProps {
  query: string;
  onSelect: () => void;
}

const WikiSearchResults: React.FC<WikiSearchResultsProps> = ({ query, onSelect }) => {
  const { data: results, isLoading } = useWikiSearchQuery(query);

  if (query.length < 2) return null;
  if (isLoading) return <div className="text-muted small p-3">Searching...</div>;
  if (!results || results.length === 0) return <div className="text-muted small p-3">No results for "{query}"</div>;

  return (
    <div className="list-group">
      {results.map(r => (
        <Link
          key={r.id}
          to={`/wiki/${r.slug}`}
          className="list-group-item list-group-item-action"
          onClick={onSelect}
        >
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <strong>{r.title}</strong>
              <span className="badge bg-secondary ms-2 small">{r.category}</span>
            </div>
          </div>
          <p className="mb-0 text-muted small text-truncate">{r.snippet}</p>
          {r.tags && (
            <div className="mt-1">
              {r.tags.split(",").map(tag => (
                <span key={tag.trim()} className="badge bg-light text-dark me-1" style={{ fontSize: "0.7em" }}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
};

export default WikiSearchResults;
