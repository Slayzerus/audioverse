import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const DmxProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">{t("dmxProjects.title")}</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/dmx-editor")}
        >
          {t("dmxProjects.createNew")}
        </button>
      </div>

      <p className="text-muted mb-3">{t("dmxProjects.subtitle")}</p>

      <div className="card">
        <div className="card-body">
          <div className="text-muted">{t("dmxProjects.noApiYet")}</div>
        </div>
      </div>
    </div>
  );
};

export default DmxProjectsPage;
