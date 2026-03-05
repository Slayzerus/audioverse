import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUltrastarSongsQuery } from "../../../scripts/api/apiLibraryUltrastar";

const KaraokeProjectList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: songs = [], isLoading, isError } = useUltrastarSongsQuery(undefined, true);

  if (isLoading) {
    return <div className="text-muted">{t("common.loading")}</div>;
  }

  if (isError) {
    return (
      <div className="alert alert-warning d-flex align-items-center" role="alert">
        <i className="bi bi-exclamation-triangle me-2" />
        {t("karaokeProjects.loadError", "Could not load karaoke projects. The server may be unavailable.")}
      </div>
    );
  }

  if (!songs.length) {
    return <div className="text-muted">{t("karaokeProjects.empty")}</div>;
  }

  return (
    <div className="list-group">
      {songs.map((song, index) => {
        const songId = song.id ?? 0;
        const key = songId > 0 ? String(songId) : `${song.title}-${song.artist}-${index}`;
        const canOpen = songId > 0;

        return (
          <button
            key={key}
            type="button"
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            onClick={() => canOpen && navigate(`/karaoke-editor/${songId}`)}
            disabled={!canOpen}
          >
            <div className="text-start">
              <div className="fw-semibold">{song.title || "—"}</div>
              <div className="small text-muted">{song.artist || "—"}</div>
            </div>
            {songId > 0 ? <span className="badge bg-secondary">#{songId}</span> : null}
          </button>
        );
      })}
    </div>
  );
};

export default KaraokeProjectList;
