import React from "react";
import { useTranslation } from 'react-i18next';
import { QueryClient, UseMutationResult } from "@tanstack/react-query";
import { NavigateFunction } from "react-router-dom";
import { KaraokePartyRound, KaraokeRoundPart, KaraokeParty, KaraokeSinging } from "../../../models/modelsKaraoke";
import RoundActions from "./RoundActions";

type AddRoundPartResult = { roundPartId: number } & KaraokeRoundPart;

interface Props {
  round: KaraokePartyRound;
  idx: number;
  readyIndex: number;
  playersMap: Map<number, string>;
  userId: number | null | undefined;
  userProfileIds: number[];
  addRoundPartMutation: UseMutationResult<AddRoundPartResult, unknown, Partial<KaraokeRoundPart>>;
  queryClient: QueryClient;
  party: KaraokeParty;
  navigate: NavigateFunction;
  isAdmin: boolean;
  setPartsModalRoundId: (id: number) => void;
  setShowPartsModal: (v: boolean) => void;
  setNewPartNumber: (n: number) => void;
  setPlayersModalRoundId?: (id: number) => void;
  setShowPlayersModal?: (v: boolean) => void;
}

const RoundCard: React.FC<Props> = ({ round, idx, readyIndex, playersMap, userId, userProfileIds, addRoundPartMutation, queryClient, party, navigate, isAdmin, setPartsModalRoundId, setShowPartsModal, setNewPartNumber, setPlayersModalRoundId, setShowPlayersModal }) => {
  const { t } = useTranslation();
  const configured = !!round.songId;
  const finished = Array.isArray(round.singing) && round.singing.length > 0;
  let bg = '#f0f0f0';
  if (finished) bg = '#ffd700';
  else if (idx === readyIndex && configured) bg = '#d4edda';
  else if (configured) bg = '#f5f1e6';

  let winner = '-';
  let winnerScore: number | null = null;
  if (finished) {
    const singings = round.singing as KaraokeSinging[];
    if (singings && singings.length) {
      let best = singings[0];
      for (const s of singings) { if ((s.score ?? 0) > (best.score ?? 0)) best = s; }
      winnerScore = best.score ?? null;
      winner = playersMap.get(best.playerId) ?? `#${best.playerId}`;
    }
  }

  return (
    <div className="card mb-2" style={{background: bg}}>
      <div className="row g-0 align-items-center">
        <div className="col-auto p-2">
          <img src={(round.song?.coverPath) ?? ''} alt={t('party.round.coverAlt')} style={{width:72,height:72,objectFit:'cover'}} />
        </div>
        <div className="col">
          <div className="card-body py-2">
            <div className="d-flex justify-content-between">
              <div>
                <div className="fw-bold">{round.song?.title ?? t('party.round.songFallback', { id: round.songId ?? '—' })}</div>
                <div className="text-muted small">{round.song?.artist ?? '—'}</div>
              </div>
              <div className="text-end small">
                <div>{t('party.round.winner')} <strong>{winner}</strong></div>
                <div>{winnerScore != null ? t('party.round.score', { score: winnerScore }) : '—'}</div>
              </div>
            </div>
            <div className="mt-2">
                  <RoundActions
                    round={round}
                    isAdmin={isAdmin}
                    setPartsModalRoundId={setPartsModalRoundId}
                    setShowPartsModal={setShowPartsModal}
                    setNewPartNumber={setNewPartNumber}
                    setPlayersModalRoundId={setPlayersModalRoundId}
                    setShowPlayersModal={setShowPlayersModal}
                    userId={userId}
                    userProfileIds={userProfileIds}
                    addRoundPartMutation={addRoundPartMutation}
                    queryClient={queryClient}
                    party={party}
                    navigate={navigate}
                  />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RoundCard);
