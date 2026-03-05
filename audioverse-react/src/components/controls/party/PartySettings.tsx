import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { PartyStatus } from "../../../models/modelsKaraoke";
import { EventLocationType, EventAccessType } from "../../../models/karaoke/modelsEvent";
import type { Event } from "../../../models/karaoke/modelsEvent";
import type { UpdatePartyFields } from "../../../pages/party/usePartyPage";
import { useTranslation } from "react-i18next";
import { cancelEvent } from "../../../scripts/api/apiEvents";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import EventTabsSettings from "./EventTabsSettings";

interface Props {
  isOrganizer: boolean;
  party: Event;
  updatePartyMutation: UseMutationResult<void, Error, UpdatePartyFields>;
  normalizeEnumToString: (enumObj: Record<string, string | number>, val: string | number | undefined) => string | undefined;
  accessSelection: string;
  setAccessSelection: (v: string) => void;
  startInput: string;
  setStartInput: (s: string) => void;
  endInput: string;
  setEndInput: (s: string) => void;
}

const PartySettings: React.FC<Props> = ({ isOrganizer, party, updatePartyMutation, normalizeEnumToString, accessSelection, setAccessSelection, startInput, setStartInput: _setStartInput, endInput, setEndInput: _setEndInput }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = React.useState(false);

  if (isOrganizer) {
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          updatePartyMutation.mutate({
            status: form.status.value as PartyStatus,
            type: form.type.value as unknown as EventLocationType,
            access: form.access.value as unknown as EventAccessType,
            code: form.code ? form.code.value : undefined,
            start: startInput,
            end: endInput,
          });
        }}
      >
        <div className="row gx-3 align-items-center mb-3">
          <div className="col-12 col-md-3">
            <div className="row g-0 align-items-center">
              <div className="col-4 text-end pe-2"><label className="mb-0" htmlFor="partyStatus">{t('party.status')}</label></div>
              <div className="col-8">
                <select name="status" id="partyStatus" defaultValue={normalizeEnumToString(PartyStatus, party.status) ?? PartyStatus.Draft} className="form-select">
                  {Object.values(PartyStatus).map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <div className="row g-0 align-items-center">
              <div className="col-4 text-end pe-2"><label className="mb-0" htmlFor="partyType">{t('party.type')}</label></div>
              <div className="col-8">
                <select name="type" id="partyType" defaultValue={normalizeEnumToString(EventLocationType, party.type) ?? "Virtual"} className="form-select">
                  {Object.values(EventLocationType).filter((v): v is string => typeof v === 'string').map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <div className="row g-0 align-items-center">
              <div className="col-4 text-end pe-2"><label className="mb-0" htmlFor="partyAccess">{t('party.access')}</label></div>
              <div className="col-8">
                <select name="access" id="partyAccess" defaultValue={normalizeEnumToString(EventAccessType, party.access) ?? "Public"} className="form-select" onChange={e => setAccessSelection(e.target.value)}>
                  {Object.values(EventAccessType).filter((v): v is string => typeof v === 'string').map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <div className="row gx-2 align-items-center">
              <div className="col-4 text-end pe-2"><label className="mb-0" htmlFor="partyCode">{t('party.code')}</label></div>
              <div className="col-6">
                {accessSelection === "Code" ? (
                  <input name="code" id="partyCode" type="password" className="form-control" />
                ) : (
                  <div style={{height: '38px'}} />
                )}
              </div>
              <div className="col-2 mt-2 mt-md-0">
                <button type="submit" className="btn btn-primary w-100" style={{height:40}} disabled={updatePartyMutation.isPending} title={t('common.save')} aria-label={t('common.save')}>
                  <i className="fa fa-save" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cancel party ── */}
        <div className="d-flex justify-content-end mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
            disabled={cancelling}
            onClick={async () => {
              const reason = prompt(t('party.cancelReasonPrompt', 'Powód odwołania (opcjonalnie):'));
              if (reason === null) return; // user pressed Cancel on the prompt
              setCancelling(true);
              try {
                await cancelEvent(party.id, reason || undefined);
                // Invalidate parties list so the cancelled party disappears immediately
                await queryClient.invalidateQueries({ queryKey: ["karaoke", "parties"] });
                navigate('/parties');
              } catch {
                setCancelling(false);
              }
            }}
          >
            <i className="fa fa-ban" aria-hidden="true" />
            {cancelling ? t('common.loading') : t('party.cancelParty', 'Odwołaj imprezę')}
          </button>
        </div>

        {/* ── Tab visibility management ── */}
        <EventTabsSettings eventId={party.id} />
      </form>
    );
  }

  return (
    <ul className="list-unstyled mb-0">
      <li><strong>{t('party.status')}</strong> {normalizeEnumToString(PartyStatus, party.status) ?? "—"}</li>
      <li><strong>{t('party.type')}</strong> {normalizeEnumToString(EventLocationType, party.type) ?? "—"}</li>
      <li><strong>{t('party.access')}</strong> {normalizeEnumToString(EventAccessType, party.access) ?? "—"}</li>
    </ul>
  );
};

export default PartySettings;
