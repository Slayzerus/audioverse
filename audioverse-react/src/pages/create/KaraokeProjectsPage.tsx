import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import KaraokeProjectList from "../../components/forms/editor/KaraokeProjectList";

const KaraokeProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">{t("karaokeProjects.title")}</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/karaoke-editor")}
        >
          {t("karaokeProjects.createNew")}
        </button>
      </div>

      <p className="text-muted mb-3">{t("karaokeProjects.subtitle")}</p>

      <KaraokeProjectList />
    </div>
  );
};

export default KaraokeProjectsPage;
