import React from "react";
import { useTranslation } from 'react-i18next';
import { QueryClient, UseMutationResult } from "@tanstack/react-query";
import { NavigateFunction } from "react-router-dom";
import { KaraokePartyRound, KaraokeRoundPart, KaraokeParty } from "../../../models/modelsKaraoke";

type AddRoundPartResult = { roundPartId: number } & KaraokeRoundPart;

interface Props {
  round: KaraokePartyRound;
  isAdmin: boolean;
  setPartsModalRoundId: (id: number) => void;
  setShowPartsModal: (v: boolean) => void;
  setNewPartNumber: (n: number) => void;
  setPlayersModalRoundId?: (id: number) => void;
  setShowPlayersModal?: (v: boolean) => void;
  userId: number | null | undefined;
  userProfileIds: number[];
  addRoundPartMutation: UseMutationResult<AddRoundPartResult, unknown, Partial<KaraokeRoundPart>>;
  queryClient: QueryClient;
  party: KaraokeParty;
  navigate: NavigateFunction;
}

const RoundActions: React.FC<Props> = ({ round, isAdmin, setPartsModalRoundId, setShowPartsModal, setNewPartNumber, setPlayersModalRoundId, setShowPlayersModal, userId, userProfileIds, addRoundPartMutation, queryClient, party, navigate }) => {
  const { t } = useTranslation();
  const handleManage = () => {
    setPartsModalRoundId(round.id);
    setShowPartsModal(true);
    setNewPartNumber(((round.parts && round.parts.length) ? (round.parts.length + 1) : 1));
  };

  const handleStart = async () => {
    const parts = Array.isArray(round.parts) ? round.parts : [];
    const myPart = parts.find((p) => p.playerId === userId || p.playerId === userProfileIds[0]);
    let partId = myPart ? myPart.id : null;
    if (!partId) {
      const freePart = parts.find((p) => !p.playerId);
      try {
        if (freePart) {
          const res = await addRoundPartMutation.mutateAsync({ roundId: round.id, partNumber: freePart.partNumber, playerId: userId });
          partId = res?.roundPartId ?? freePart.id;
        } else {
          const nextNumber = parts.length ? (Math.max(...parts.map((p) => p.partNumber)) + 1) : 1;
          const res = await addRoundPartMutation.mutateAsync({ roundId: round.id, partNumber: nextNumber, playerId: userId });
          partId = res?.roundPartId ?? null;
        }
        queryClient.invalidateQueries({ queryKey: ["karaoke", "party", party.id, "status"] });
      } catch (_e) { /* Best-effort — no action needed on failure */ }
    }
    navigate('/rounds', { state: { song: round.song, gameMode: 'normal', roundId: round.id, roundPartId: partId, partyId: party?.id, partyName: party?.name } });
  };

  return (
    <div className="d-flex justify-content-end">
      {isAdmin && (
        <>
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={handleManage}>{t('party.round.manageParts')}</button>
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setPlayersModalRoundId?.(round.id); setShowPlayersModal?.(true); }}>{t('party.round.manageAssignments')}</button>
        </>
      )}
      <button className="btn btn-sm btn-primary" onClick={handleStart}>{t('party.round.start')}</button>
    </div>
  );
};

export default React.memo(RoundActions);
