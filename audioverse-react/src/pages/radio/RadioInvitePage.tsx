import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Focusable } from "../../components/common/Focusable";
import {
    useVerifyInviteQuery,
    useAcceptInviteMutation,
} from "../../scripts/api/apiRadio";

const RadioInvitePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data: invite, isLoading, isError } = useVerifyInviteQuery(token ?? "");
    const acceptMut = useAcceptInviteMutation();

    const [guestName, setGuestName] = useState("");
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => {
        if (!token) return;
        acceptMut.mutate(
            { token, body: guestName.trim() ? { guestName: guestName.trim() } : undefined },
            {
                onSuccess: () => setAccepted(true),
            },
        );
    };

    if (isLoading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border" />
            </div>
        );
    }

    if (isError || !invite) {
        return (
            <div className="container py-4">
                <h2>📻 {t("radioInvite.title", "Radio Invite")}</h2>
                <div className="alert alert-warning">
                    {t("radioInvite.invalid", "This invite link is invalid or has expired.")}
                </div>
            </div>
        );
    }

    if (accepted) {
        return (
            <div className="container py-4">
                <h2>📻 {t("radioInvite.title", "Radio Invite")}</h2>
                <div className="alert alert-success">
                    <h5>{t("radioInvite.accepted", "Invite Accepted!")}</h5>
                    <p>
                        {t("radioInvite.acceptedDesc", "You have been added as a guest to {{station}}.", {
                            station: invite.stationName,
                        })}
                    </p>
                    <Focusable id="invite-goto-station">
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/radio/${invite.radioStationId}`)}
                        >
                            {t("radioInvite.goToStation", "Go to Radio Station")}
                        </button>
                    </Focusable>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2>📻 {t("radioInvite.title", "Radio Invite")}</h2>

            <div className="card" style={{ maxWidth: 500, margin: "0 auto" }}>
                <div className="card-body text-center">
                    <h4 className="mb-3">{invite.stationName}</h4>
                    <p className="text-muted">
                        {t("radioInvite.youAreInvited", "You have been invited to join as a guest DJ.")}
                    </p>

                    <div className="mb-3">
                        <small className="text-muted d-block">
                            {t("radioInvite.validWindow", "Valid from {{from}} to {{to}}", {
                                from: new Date(invite.validFrom).toLocaleString(),
                                to: new Date(invite.validTo).toLocaleString(),
                            })}
                        </small>
                    </div>

                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t("radioInvite.guestNamePlaceholder", "Your display name (optional)")}
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>

                    <Focusable id="invite-accept-btn">
                        <button
                            className="btn btn-success btn-lg"
                            onClick={handleAccept}
                            disabled={acceptMut.isPending}
                        >
                            {acceptMut.isPending
                                ? t("common.loading", "Loading…")
                                : t("radioInvite.accept", "Accept Invite")}
                        </button>
                    </Focusable>

                    {acceptMut.isError && (
                        <div className="alert alert-danger mt-3">
                            {t("radioInvite.error", "Failed to accept the invite. Please try again.")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RadioInvitePage;
