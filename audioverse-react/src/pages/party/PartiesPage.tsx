import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import PartiesList from '../../components/party/PartiesList';
import { Focusable } from "../../components/common/Focusable";
import CreatePartyForm from "../../components/forms/CreatePartyForm";

const PartiesPage: React.FC = () => {
    const { t } = useTranslation();
    const [showCreate, setShowCreate] = useState(false);

    return (
        <div className="container mt-4">
            <div className="d-flex align-items-center mb-4" style={{ position: 'relative' }}>
                <h1 className="mb-0" style={{ flex: 1, textAlign: 'center' }}>{t("partiesPage.title")}</h1>
                <Focusable id="parties-add-btn" style={{ position: 'absolute', right: 0 }}>
                    <button
                        className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 48, height: 48, fontSize: 24 }}
                        title={t("partiesPage.newParty")}
                        onClick={() => setShowCreate(true)}
                    >
                        +
                    </button>
                </Focusable>
            </div>

            <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t("partiesPage.newParty")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CreatePartyForm onCreated={() => setShowCreate(false)} />
                </Modal.Body>
            </Modal>

            <PartiesList />
        </div>
    );
};

export default PartiesPage;
