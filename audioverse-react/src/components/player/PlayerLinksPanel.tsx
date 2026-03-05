// PlayerLinksPanel.tsx — UI for managing player links (search, confirm, list, revoke)
import React, { useState, useCallback } from "react";
import {
  usePlayerLinksQuery,
  useSearchPlayerLinkMutation,
  useConfirmPlayerLinkMutation,
  useDeletePlayerLinkMutation,
} from "../../scripts/api/apiPlayerLinks";
import {
  PlayerLinkScope,
  PlayerLinkStatus,
} from "../../models/modelsPlayerLinks";
import type {
  LinkCandidatePlayerDto,
  PlayerLinkDto,
} from "../../models/modelsPlayerLinks";

interface PlayerLinksPanelProps {
  profileId: number;
  playerId: number;
}

function describeScopeFlags(scope: number): string {
  if (scope === PlayerLinkScope.All) return "All";
  const parts: string[] = [];
  if (scope & PlayerLinkScope.Progress) parts.push("Progress");
  if (scope & PlayerLinkScope.Appearance) parts.push("Appearance");
  if (scope & PlayerLinkScope.KaraokeSettings) parts.push("Karaoke Settings");
  return parts.join(", ") || "None";
}

const PlayerLinksPanel: React.FC<PlayerLinksPanelProps> = ({ profileId, playerId }) => {
  const { data: linksData, isLoading } = usePlayerLinksQuery(profileId, playerId);
  const searchMutation = useSearchPlayerLinkMutation();
  const confirmMutation = useConfirmPlayerLinkMutation();
  const deleteMutation = useDeletePlayerLinkMutation();

  const [showLink, setShowLink] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [candidates, setCandidates] = useState<LinkCandidatePlayerDto[] | null>(null);
  const [selectedScope, setSelectedScope] = useState<number>(PlayerLinkScope.All);
  const [error, setError] = useState<string | null>(null);

  const links = linksData?.links ?? [];

  const handleSearch = useCallback(async () => {
    setError(null);
    setCandidates(null);
    searchMutation.mutate(
      { profileId, playerId, req: { login, password } },
      {
        onSuccess: (data) => {
          if (!data.success || data.players.length === 0) {
            setError("No players found. Check credentials and try again.");
          } else {
            setCandidates(data.players);
          }
        },
        onError: () => setError("Search failed. Check credentials."),
      },
    );
  }, [profileId, playerId, login, password, searchMutation]);

  const handleConfirm = useCallback((targetPlayerId: number) => {
    confirmMutation.mutate(
      { profileId, playerId, req: { targetPlayerId, scope: selectedScope } },
      {
        onSuccess: () => {
          setCandidates(null);
          setLogin("");
          setPassword("");
          setShowLink(false);
        },
        onError: () => setError("Link failed. It may already exist."),
      },
    );
  }, [profileId, playerId, selectedScope, confirmMutation]);

  const handleRevoke = useCallback((linkId: number) => {
    if (!confirm("Revoke this player link?")) return;
    deleteMutation.mutate({ profileId, playerId, linkId });
  }, [profileId, playerId, deleteMutation]);

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span><i className="bi bi-link-45deg me-1" />Player Links</span>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => { setShowLink(!showLink); setCandidates(null); setError(null); }}
        >
          {showLink ? "Cancel" : "Link player"}
        </button>
      </div>
      <div className="card-body">
        {/* Existing links */}
        {isLoading && <div className="text-muted small">Loading links...</div>}
        {links.length === 0 && !isLoading && (
          <div className="text-muted small mb-2">No active links.</div>
        )}
        {links.map(link => (
          <LinkRow key={link.id} link={link} onRevoke={() => handleRevoke(link.id)} />
        ))}

        {/* Link wizard */}
        {showLink && (
          <div className="border rounded p-3 mt-2">
            <h6 className="mb-2">Step 1: Authenticate other profile</h6>
            <div className="row g-2 mb-2">
              <div className="col">
                <input
                  className="form-control form-control-sm"
                  placeholder="Login"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                />
              </div>
              <div className="col">
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="col-auto">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSearch}
                  disabled={!login || !password || searchMutation.isPending}
                >
                  {searchMutation.isPending ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-warning small py-1">{error}</div>}

            {candidates && candidates.length > 0 && (
              <>
                <h6 className="mb-2 mt-3">Step 2: Select player & scope</h6>
                <div className="mb-2">
                  <label className="form-label small">Sync scope:</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedScope}
                    onChange={e => setSelectedScope(Number(e.target.value))}
                  >
                    <option value={PlayerLinkScope.Progress}>Progress only</option>
                    <option value={PlayerLinkScope.Appearance}>Appearance only</option>
                    <option value={PlayerLinkScope.KaraokeSettings}>Karaoke Settings only</option>
                    <option value={PlayerLinkScope.Progress | PlayerLinkScope.Appearance}>Progress + Appearance</option>
                    <option value={PlayerLinkScope.All}>All (Progress + Appearance + Karaoke)</option>
                  </select>
                </div>
                <div className="list-group">
                  {candidates.map(c => (
                    <button
                      key={c.playerId}
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      onClick={() => handleConfirm(c.playerId)}
                      disabled={confirmMutation.isPending}
                    >
                      <span>
                        <span
                          className="d-inline-block rounded-circle me-2"
                          style={{ width: 12, height: 12, backgroundColor: c.preferredColors.split(",")[0] || "#ccc" }}
                        />
                        {c.playerName}
                        {c.isPrimary && <span className="badge bg-info ms-1 small">Primary</span>}
                      </span>
                      <i className="bi bi-link text-primary" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function LinkRow({ link, onRevoke }: { link: PlayerLinkDto; onRevoke: () => void }) {
  const isRevoked = link.status === PlayerLinkStatus.Revoked;
  return (
    <div className={`d-flex justify-content-between align-items-center small border rounded p-2 mb-1 ${isRevoked ? "opacity-50" : ""}`}>
      <div>
        <i className="bi bi-link-45deg me-1 text-primary" />
        <strong>{link.sourcePlayerName}</strong>
        <i className="bi bi-arrow-right mx-1" />
        <strong>{link.targetPlayerName}</strong>
        <span className="text-muted ms-2">({describeScopeFlags(link.scope)})</span>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span className={`badge ${isRevoked ? "bg-danger" : "bg-success"}`}>
          {isRevoked ? "Revoked" : "Active"}
        </span>
        {!isRevoked && (
          <button className="btn btn-sm btn-link text-danger p-0" onClick={onRevoke} title="Revoke">
            <i className="bi bi-x-circle" />
          </button>
        )}
      </div>
    </div>
  );
}

export default PlayerLinksPanel;
