import React from "react";
import { QueryClient, UseMutationResult } from "@tanstack/react-query";
import { NavigateFunction } from "react-router-dom";
import { KaraokePartyRound, KaraokeRoundPart, KaraokeParty, KaraokePlayer } from "../../../models/modelsKaraoke";
import RoundCard from "./RoundCard";

interface Props {
  rounds: KaraokePartyRound[];
  participants: KaraokePlayer[];
  userId: number | null | undefined;
  userProfileIds: number[];
  addRoundPartMutation: UseMutationResult<{ roundPartId: number } & KaraokeRoundPart, unknown, Partial<KaraokeRoundPart>>;
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

const RoundsList: React.FC<Props> = ({ rounds, participants, userId, userProfileIds, addRoundPartMutation, queryClient, party, navigate, isAdmin, setPartsModalRoundId, setShowPartsModal, setNewPartNumber, setPlayersModalRoundId, setShowPlayersModal }) => {
  const playersMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (participants ?? []).forEach(p => { if (p?.id) map.set(p.id, p.name ?? `#${p.id}`); });
    return map;
  }, [participants]);

  let readyIndex = -1;
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    const configured = !!r.songId;
    const finished = Array.isArray(r.singing) && r.singing.length > 0;
    if (configured && !finished) { readyIndex = i; break; }
  }

  return (
    <div className="d-flex flex-column">
      {rounds.map((round, idx) => (
        <RoundCard
          key={round.id ?? idx}
          round={round}
          idx={idx}
          readyIndex={readyIndex}
          playersMap={playersMap}
          userId={userId}
          userProfileIds={userProfileIds}
          addRoundPartMutation={addRoundPartMutation}
          queryClient={queryClient}
          party={party}
          navigate={navigate}
          isAdmin={isAdmin}
          setPartsModalRoundId={setPartsModalRoundId}
          setShowPartsModal={setShowPartsModal}
          setPlayersModalRoundId={setPlayersModalRoundId}
          setShowPlayersModal={setShowPlayersModal}
          setNewPartNumber={setNewPartNumber}
        />
      ))}
    </div>
  );
};

export default RoundsList;
