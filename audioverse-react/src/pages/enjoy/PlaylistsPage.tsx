import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import { usePlaylistsQuery } from "../../scripts/api/apiPlaylists";

const PlaylistsPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: playlists = [], isLoading } = usePlaylistsQuery();

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="mb-0">{t("playlistsPage.title")}</h1>
            </div>

            {isLoading && <p>{t("common.loading")}</p>}

            {!isLoading && playlists.length === 0 && (
                <p className="text-muted">{t("playlistsPage.empty")}</p>
            )}

            <div className="row g-3">
                {playlists.map((p) => (
                    <div key={p.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <Focusable id={`playlist-${p.id}`}>
                            <Link to={`/playlists/${p.id}`} className="card text-decoration-none h-100">
                                <div
                                    className="card-body d-flex flex-column"
                                    style={{ height: 160 }}
                                >
                                    <h5 className="card-title">{p.name}</h5>
                                    {p.description && <p className="card-text text-muted">{p.description}</p>}
                                    <div className="mt-auto d-flex justify-content-between align-items-center">
                                        <small className="text-muted">{t("playlistsPage.items", { count: p.itemCount ?? 0 })}</small>
                                        {p.cover ? (
                                            <img src={p.cover} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                                        ) : null}
                                    </div>
                                </div>
                            </Link>
                        </Focusable>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlaylistsPage;
