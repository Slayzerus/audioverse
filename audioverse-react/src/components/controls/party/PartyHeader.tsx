import React from "react";
import { useTranslation } from 'react-i18next';
import type { KaraokeParty } from "../../../models/modelsKaraoke";
import type { UseMutationResult } from "@tanstack/react-query";
import type { UpdatePartyFields } from "../../../pages/party/usePartyPage";

interface Props {
  party: KaraokeParty;
  isOrganizer: boolean;
  editHeaderDates: boolean;
  setEditHeaderDates: (v: boolean) => void;
  startInput: string;
  setStartInput: (s: string) => void;
  endInput: string;
  setEndInput: (s: string) => void;
  updatePartyMutation: UseMutationResult<void, Error, UpdatePartyFields>;
  isoToLocalInput: (iso?: string | null) => string;
}

const PartyHeader: React.FC<Props> = ({ party, isOrganizer, editHeaderDates, setEditHeaderDates, startInput, setStartInput, endInput, setEndInput, updatePartyMutation, isoToLocalInput }) => {
  const { t } = useTranslation();

  return (
    <div className="position-relative mb-2" style={{ padding: '8px' }}>
      <div className="text-white text-end" style={{ whiteSpace: 'nowrap', minWidth: 280 }}>
        {isOrganizer ? (
          editHeaderDates ? (
            <div className="d-flex align-items-center">
              <div className="d-flex flex-column me-2">
                <div className="d-flex align-items-center mb-1">
                  <input type="datetime-local" className="form-control form-control-sm" value={startInput} onChange={e => setStartInput(e.target.value)} aria-label={t('party.startLabel')} />
                  <button type="button" className="btn btn-sm btn-outline-secondary ms-2 p-1" title={t('party.clearStart')} aria-label={t('party.clearStart')} onClick={() => setStartInput("") }>
                    <i className="fa fa-times" />
                  </button>
                </div>
                <div className="d-flex align-items-center">
                  <input type="datetime-local" className="form-control form-control-sm" value={endInput} onChange={e => setEndInput(e.target.value)} aria-label={t('party.endLabel')} />
                  <button type="button" className="btn btn-sm btn-outline-secondary ms-2 p-1" title={t('party.clearEnd')} aria-label={t('party.clearEnd')} onClick={() => setEndInput("") }>
                    <i className="fa fa-times" />
                  </button>
                </div>
              </div>
              <div className="d-flex flex-column align-items-center">
                <button type="button" className="btn btn-sm btn-primary p-0 mb-1 rounded-0 d-flex align-items-center justify-content-center" style={{width:40,height:40}} title={t('common.save')} aria-label={t('common.save')} onClick={() => updatePartyMutation.mutate({ start: startInput, end: endInput }, { onSuccess: () => setEditHeaderDates(false) })}>
                  <i className="fa fa-save" />
                </button>
                <button type="button" className="btn btn-sm btn-secondary p-0 rounded-0 d-flex align-items-center justify-content-center" style={{width:40,height:40}} title={t('common.cancel')} aria-label={t('common.cancel')} onClick={() => { setStartInput(isoToLocalInput(party.startTime)); setEndInput(isoToLocalInput(party.endTime)); setEditHeaderDates(false); }}>
                  <i className="fa-solid fa-arrow-rotate-left" />
                </button>
              </div>
            </div>
          ) : (
            <div style={{cursor: 'pointer'}} onClick={() => setEditHeaderDates(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setEditHeaderDates(true); }}>
              <div>{t('party.startLabel')} {party.startTime ? new Date(party.startTime).toLocaleString() : "—"}</div>
              {party.endTime ? <div>{t('party.endLabel')} {new Date(party.endTime).toLocaleString()}</div> : null}
            </div>
          )
        ) : (
          <div>
            <div>{t('party.startLabel')} {party.startTime ? new Date(party.startTime).toLocaleString() : "—"}</div>
            {party.endTime ? <div>{t('party.endLabel')} {new Date(party.endTime).toLocaleString()}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PartyHeader);
