import React from 'react';
import { useTranslation } from "react-i18next";

interface ParticipantEntry {
  id?: number;
  name?: string;
  profileId?: number;
  userId?: number;
  user?: { id?: number; name?: string } | null;
}

interface Props {
  participants: ParticipantEntry[];
  waiting: ParticipantEntry[];
  onApprove: (entry: ParticipantEntry) => Promise<void> | void;
  onReject: (entry: ParticipantEntry) => Promise<void> | void;
}

const ParticipantsApprovalPanel: React.FC<Props> = ({ participants, waiting, onApprove, onReject }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="mb-2">{t("participantsPanel.joinedPeople")}</h6>
          {participants && participants.length ? (
            <ul className="list-group list-group-flush">
              {participants.map((p: ParticipantEntry, i: number) => (
                <li key={p.id ?? i} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{p.name}</div>
                    <div className="small text-muted">#{p.id ?? p.profileId ?? '–'}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (<div className="text-muted">{t("participantsPanel.noJoinedPeople")}</div>)}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h6 className="mb-2">{t("participantsPanel.waitingVerification")}</h6>
          {waiting && waiting.length ? (
            <ul className="list-group list-group-flush">
              {waiting.map((w: ParticipantEntry, idx: number) => (
                <li key={w.id ?? w.userId ?? idx} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{w.user?.name ?? w.name ?? `#${w.userId ?? w.id ?? idx}`}</div>
                    <div className="small text-muted">ID: {w.userId ?? w.id ?? '—'}</div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-success me-2" onClick={() => onApprove(w)}>{t("common.approved")}</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onReject(w)}>{t("common.reject")}</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (<div className="text-muted">{t("participantsPanel.noWaitingEntries")}</div>)}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ParticipantsApprovalPanel);
