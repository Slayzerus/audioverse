// WikiPage.tsx — Main wiki viewer page: sidebar + content or search results
import React, { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import WikiSidebar from "../../components/wiki/WikiSidebar";
import WikiContent from "../../components/wiki/WikiContent";
import WikiSearchResults from "../../components/wiki/WikiSearchResults";

const WikiPage: React.FC = () => {
  const { "*": slug = "" } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input (300ms)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clear search when navigating to a page
  const handleSearchSelect = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
  }, []);

  const showSearch = debouncedQuery.length >= 2;

  return (
    <div className="container-fluid py-3" role="main" aria-label="Wiki">
      <div className="d-flex gap-4">
        <WikiSidebar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          {showSearch ? (
            <div>
              <h4 className="mb-3">Search results for "{debouncedQuery}"</h4>
              <WikiSearchResults query={debouncedQuery} onSelect={handleSearchSelect} />
            </div>
          ) : slug ? (
            <WikiContent slug={slug} />
          ) : (
            <WikiHome />
          )}
        </div>
      </div>
    </div>
  );
};

/** Default wiki landing page when no slug is selected */
function WikiHome() {
  return (
    <div className="p-4">
      <h1><i className="bi bi-book me-2" />AudioVerse Wiki</h1>
      <p className="lead text-muted">
        Browse the documentation using the sidebar navigation, or search for topics.
      </p>
      <div className="row g-3 mt-3">
        <InfoCard title="Getting Started" slug="getting-started" icon="bi-rocket-takeoff" />
        <InfoCard title="Architecture" slug="architecture" icon="bi-diagram-3" />
        <InfoCard title="API Overview" slug="api/endpoints" icon="bi-code-slash" />
        <InfoCard title="Karaoke" slug="karaoke/overview" icon="bi-music-note-beamed" />
        <InfoCard title="FAQ" slug="guide/faq" icon="bi-question-circle" />
        <InfoCard title="Docker" slug="infra/docker" icon="bi-box-seam" />
      </div>
    </div>
  );
}

function InfoCard({ title, slug, icon }: { title: string; slug: string; icon: string }) {
  return (
    <div className="col-md-4 col-sm-6">
      <Link to={`/wiki/${slug}`} className="text-decoration-none">
        <div className="card h-100 shadow-sm border-0">
          <div className="card-body text-center py-4">
            <i className={`bi ${icon} fs-1 text-primary mb-2 d-block`} />
            <h6 className="card-title mb-0">{title}</h6>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default WikiPage;
