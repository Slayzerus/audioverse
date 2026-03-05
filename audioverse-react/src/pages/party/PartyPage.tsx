import React from "react";
import CurtainTransition from "../../components/common/CurtainTransition";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { usePartyPage } from "./usePartyPage";
import type { LobbyMember } from "./usePartyPage";
import EventMediaPanel from "../../components/controls/party/EventMediaPanel";
import EventCommentsPanel from "../../components/controls/party/EventCommentsPanel";
import GameSessionScoringPanel from "../../components/controls/party/GameSessionScoringPanel";
import DateProposalsPanel from "../../components/controls/party/DateProposalsPanel";
import EventBillingPanel from "../../components/controls/party/EventBillingPanel";
import EventPollsPanel from "../../components/controls/party/EventPollsPanel";
import EventInviteTemplatesPanel from "../../components/controls/party/EventInviteTemplatesPanel";
import EventCollagesPanel from "../../components/controls/party/EventCollagesPanel";
import GamePicksPanel from "../../components/controls/party/GamePicksPanel";
import SongPicksPanel from "../../components/controls/party/SongPicksPanel";

import { Focusable } from "../../components/common/Focusable";
import type { KaraokeSongFile } from "../../models/modelsKaraoke";
import { EventPlayerStatus } from "../../models/karaoke/modelsEvent";
import type { EventInviteDto } from "../../scripts/api/apiKaraoke";
import PartsModal from "../../components/controls/party/PartsModal";
import PartyHeader from "../../components/controls/party/PartyHeader";
import ParticipantsPanel from "../../components/controls/party/ParticipantsPanel";
import PartyNavbar from "../../components/controls/party/PartyNavbar";
import type { ViewAsRole } from "../../components/controls/party/PartyNavbar";
import PermissionsPanel from "../../components/controls/party/PermissionsPanel";
import AddRoundModal from "../../components/controls/party/AddRoundModal";
import PartySettings from "../../components/controls/party/PartySettings";
import RoundPlayersModal from "../../components/controls/party/RoundPlayersModal";
import PartyChat from "../../components/controls/party/PartyChat";
import AttractionVotingPanel from "../../components/party/AttractionVotingPanel";
import AttractionDetailModal from "../../components/party/AttractionDetailModal";
import AttractionPicker from "../../components/party/AttractionPicker";


const PartyPage: React.FC = () => {
    const navigate = useNavigate();
    const [curtainActive, setCurtainActive] = React.useState(false);
    const [curtainPhase, setCurtainPhase] = React.useState<"cover" | "reveal">("cover");
    // Ustawienia efektu kurtyny jak w KaraokeManager
    const curtainEffect = "theaterCurtain";
    const curtainPrimaryColor = "#0a0a0a";
    const curtainSecondaryColor = "#8b0000";
    const curtainDurationMs = 700;
    const p = usePartyPage();
    const [selectedAttractionId, setSelectedAttractionId] = React.useState<string | null>(null);
    const [viewAs, setViewAs] = React.useState<ViewAsRole>('organizer');

    // Handler zakończenia animacji kurtyny — must be before early returns (hooks order)
    const handleCurtainComplete = React.useCallback(() => {
        if (curtainPhase === "cover") {
            setCurtainPhase("reveal");
            document.body.classList.add("karaoke-immersive"); // Ukryj NavBar
            navigate("/rounds");
        } else {
            setCurtainActive(false);
        }
    }, [curtainPhase, navigate]);

    if (!p.partyId || !Number.isFinite(p.id)) {
        return (
            <div className="container mt-4">
                <p className="text-danger">{p.t('party.invalidId')}</p>
                <Link to="/parties">{p.t('party.backToList')}</Link>
            </div>
        );
    }

    if (p.partyLoading || !p.party) {
        return <div className="container mt-4"><p className="text-muted">{p.t('party.loadingParty')}</p></div>;
    }

    return (
        <>
        <CurtainTransition
            active={curtainActive}
            effect={curtainEffect}
            phase={curtainPhase}
            primaryColor={curtainPrimaryColor}
            secondaryColor={curtainSecondaryColor}
            durationMs={curtainDurationMs}
            onComplete={handleCurtainComplete}
        />
        <div className="container mt-4">
            {/* ── Header ── */}
            <div className="d-flex align-items-center gap-3 mb-3">
                <Focusable id="party-back-link" style={{ flexShrink: 0 }}>
                    <Link to="/parties" className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center" style={{ width: 38, height: 38, borderRadius: 10, padding: 0 }} aria-label={p.t('party.backToList')}>
                        <i className="fa fa-arrow-left" aria-hidden="true"></i>
                    </Link>
                </Focusable>
                <div className="flex-grow-1 text-center">
                    <h1 className="mb-0" style={{ fontSize: 22, fontWeight: 700 }}>{p.party.name}</h1>
                    {p.party.description && <p className="text-muted mb-0 small mt-1" style={{ maxWidth: 500, margin: '0 auto' }}>{p.party.description}</p>}
                </div>
                <div style={{ flexShrink: 0 }}>
                    <PartyHeader
                        party={p.party}
                        isOrganizer={p.isOrganizer}
                        editHeaderDates={p.editHeaderDates}
                        setEditHeaderDates={p.setEditHeaderDates}
                        startInput={p.startInput}
                        setStartInput={p.setStartInput}
                        endInput={p.endInput}
                        setEndInput={p.setEndInput}
                        updatePartyMutation={p.updatePartyMutation}
                        isoToLocalInput={p.isoToLocalInput}
                    />
                </div>
            </div>

            {/* ── Tab navigation ── */}
            {/* Ukryj NavBar jeśli trwa karaoke */}
            {!curtainActive && (
                <div className="text-center mb-4">
                    <PartyNavbar
                        activeTab={p.activeTab}
                        setActiveTab={p.setActiveTab}
                        participantsCount={p.participants.length}
                        activeCount={p.participantsRaw.filter((pp: { status?: number | string | null }) => {
                            const s = typeof pp.status === 'number' ? pp.status : Number(pp.status);
                            return s === EventPlayerStatus.Waiting || s === EventPlayerStatus.Validation || s === EventPlayerStatus.Inside;
                        }).length}
                        invitesAccepted={p.invites.filter((i: EventInviteDto)=>String(i.status)==='Accepted' || i.status === 1).length}
                        invitesSent={p.invites.length}
                        chatUnread={p.chatUnread}
                        chatTotal={p.chatTotal}
                        partyId={p.id}
                        partyName={p.party.name}
                        startTime={p.party.startTime}
                        eventTabs={p.party.tabs}
                        isOrganizer={p.isOrganizer}
                        isParticipant={p.alreadyJoined}
                        viewAs={viewAs}
                        onViewAsChange={setViewAs}
                    />
                </div>
            )}


            {/* ── Tab content ── */}
            <div className="row mb-4">
                <div className="col-12">

                    {p.activeTab === 'participants' && (
                        <>
                            <ParticipantsPanel
                                participants={p.participants}
                                participantsRaw={p.participantsRaw}
                                userProfileIds={p.userProfileIds}
                                alreadyJoined={p.alreadyJoined}
                                assignPlayerMutation={p.addParticipantMutation}
                                rsvpMutation={p.rsvpMutation}
                                arriveMutation={p.arriveMutation}
                                cancelParticipationMutation={p.cancelParticipationMutation}
                                party={p.party}
                                userId={p.userId}
                                lobbyMode={p.lobbyMode}
                                setLobbyMode={p.setLobbyMode}
                                lobbyMembers={p.lobbyMembers}
                                rtc={p.rtc}
                                setLobbyMembers={p.setLobbyMembers as React.Dispatch<React.SetStateAction<LobbyMember[]>>}
                                username={p.username ?? undefined}
                                currentUser={p.currentUser}
                            />

                            {/* Waiting list (full width) */}
                            {(() => {
                                const waiting = ((p.status as Record<string, unknown> | undefined)?.['waitingPlayers'] ?? (p.status as Record<string, unknown> | undefined)?.['pendingPlayers'] ?? []) as Array<Record<string, unknown>>;
                                return (
                                    <div className="card mb-4">
                                        <div className="card-body">
                                            <h5 className="card-title mb-3">{p.t('participantsPanel.waitingList', 'Waiting list')}</h5>
                                            {waiting.length > 0 ? (
                                                <ul className="list-group list-group-flush">
                                                    {waiting.map((w, idx) => {
                                                        const wId = (w.userId ?? w.id ?? (w.user as Record<string, unknown> | undefined)?.id) as number | undefined;
                                                        return (
                                                            <li key={wId ?? idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <div className="fw-bold">{((w.user as Record<string, unknown> | undefined)?.name ?? (w.user as Record<string, unknown> | undefined)?.fullName ?? (w.user as Record<string, unknown> | undefined)?.userName ?? w.name ?? `#${wId ?? idx}`) as string}</div>
                                                                    <div className="small text-muted">ID: {wId ?? '—'}</div>
                                                                </div>
                                                                {p.isOrganizer && (
                                                                    <div>
                                                                        <button className="btn btn-sm btn-success me-2" onClick={async () => {
                                                                            if (wId) {
                                                                                try { await p.addParticipantMutation.mutateAsync({ eventId: p.party!.id, participant: { userId: wId } }); p.queryClient.invalidateQueries({ queryKey: ['karaoke','party', p.party!.id, 'status'] }); } catch { /* Expected: addParticipant mutation may fail if party state changed */ }
                                                                            }
                                                                        }}>{p.t('common.approve', 'Approve')}</button>
                                                                        <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                                                                            if (!wId) return;
                                                                            const ok = await p.confirm(p.t('party.rejectConfirm'));
                                                                            if (!ok) return;
                                                                            try {
                                                                                await p.deleteParticipantMutation.mutateAsync({ eventId: p.party!.id, userId: wId });
                                                                                p.queryClient.invalidateQueries({ queryKey: ['karaoke','party', p.party!.id, 'status'] });
                                                                                p.showToast(p.t('party.rejected'), 'success');
                                                                            } catch { p.showToast(p.t('party.rejectFailed'), 'error'); }
                                                                        }}>{p.t('common.reject')}</button>
                                                                    </div>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <p className="text-muted mb-0">{p.t('participantsPanel.noWaitingEntries')}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}

                        {p.activeTab === 'invites' && (
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">{p.t('party.invites')}</h5>

                                    {/* ── Share link (phone join) ── */}
                                    <div className="mb-4 p-3" style={{background:'var(--card-bg)',borderRadius:12,border:'1px solid var(--card-border)'}}>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span style={{fontSize:20}}>📱</span>
                                            <strong>{p.t('party.phoneJoinLink')}</strong>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <code style={{flex:1,fontSize:13,wordBreak:'break-all',background:'var(--bg-primary)',padding:'6px 10px',borderRadius:6}}>
                                                {`${window.location.origin}/join/${p.partyIdSafe ?? p.id}`}
                                            </code>
                                            <button className="btn btn-sm btn-outline-light" onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/join/${p.partyIdSafe ?? p.id}`);
                                                p.showToast(p.t('party.linkCopied'), 'success');
                                            }}>{`📋 ${p.t('common.copy')}`}</button>
                                        </div>
                                        <small className="text-muted d-block mt-1">{p.t('party.shareLink')}</small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{p.t('party.inviteTo')}</label>
                                        {p.isOrganizer ? (
                                            <div className="d-flex">
                                                <input className="form-control me-2" placeholder={p.t('party.inviteEmailPlaceholder')} value={p.inviteEmail} onChange={(e)=>p.setInviteEmail(e.target.value)} />
                                                <input className="form-control me-2" placeholder={p.t('party.inviteUserIdPlaceholder')} value={p.inviteUserIdStr} onChange={(e)=>p.setInviteUserIdStr(e.target.value)} />
                                                <button className="btn btn-primary" disabled={p.sendInviteMutation.isPending} onClick={async () => {
                                                    const email = p.inviteEmail?.trim();
                                                    const uid = p.inviteUserIdStr?.trim();
                                                    const body: { ToUserId?: number; ToEmail?: string } = {};
                                                    if (uid && /^\d+$/.test(uid)) body.ToUserId = Number(uid);
                                                    if (email) body.ToEmail = email;
                                                    if (!body.ToUserId && !body.ToEmail) { p.showToast(p.t('party.provideEmailOrUserId'), 'error'); return; }
                                                    try {
                                                        await p.sendInviteMutation.mutateAsync(body);
                                                        p.setInviteEmail(''); p.setInviteUserIdStr('');
                                                    } catch (_e) { /* handled by mutation */ }
                                                }}>{p.sendInviteMutation.isPending ? p.t('party.inviteSending') : p.t('common.send')}</button>
                                            </div>
                                        ) : (
                                            <div className="text-muted">{p.t('party.onlyOrganizerCanInvite')}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h6>{p.t('party.inviteList')}</h6>
                                        {p.invitesLoading ? <p className="text-muted">{p.t('common.loading')}</p> : (
                                            <div style={{ overflowX: 'auto' }}>
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr><th>{p.t('party.inviteTableTo')}</th><th>{p.t('party.inviteTableMessage')}</th><th>{p.t('party.inviteTableStatus')}</th><th>{p.t('party.inviteTableCreated')}</th><th></th></tr>
                                                </thead>
                                                <tbody>
                                                    {p.invites.map((inv: EventInviteDto) => (
                                                        <tr key={inv.id}>
                                                            <td>{inv.toEmail ?? inv.toUserId ?? '—'}</td>
                                                            <td style={{maxWidth:300,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{inv.message ?? ''}</td>
                                                            <td>{inv.status ?? 'Pending'}</td>
                                                            <td>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}</td>
                                                            <td>
                                                                {String(inv.status) === 'Pending' && p.isOrganizer && (
                                                                    <button className="btn btn-sm btn-danger me-1" disabled={p.cancelInviteMutation.isPending} onClick={async () => {
                                                                        const ok = await p.confirm(p.t('party.cancelInviteConfirm'));
                                                                        if (!ok) return;
                                                                        try { await p.cancelInviteMutation.mutateAsync(inv.id); } catch (_e) { /* Best-effort — no action needed on failure */ }
                                                                    }}>{p.t('common.cancel')}</button>
                                                                )}
                                                                {String(inv.status) === 'Pending' && (inv.toUserId === p.userId) && (
                                                                    <>
                                                                        <button className="btn btn-sm btn-success me-1" onClick={async () => { try { await p.respondInvite(inv.id, true); p.showToast(p.t('party.inviteAccepted'), 'success'); if (p.partyIdSafe) p.queryClient.invalidateQueries({ queryKey: ["karaoke", "party", p.partyIdSafe, "invites"] }); } catch (_e) { p.showToast(p.t('common.error'), 'error'); } }}>{p.t('common.accept')}</button>
                                                                        <button className="btn btn-sm btn-outline-secondary" onClick={async () => { try { await p.respondInvite(inv.id, false); p.showToast(p.t('party.inviteRejected'), 'success'); if (p.partyIdSafe) p.queryClient.invalidateQueries({ queryKey: ["karaoke", "party", p.partyIdSafe, "invites"] }); } catch (_e) { p.showToast(p.t('common.error'), 'error'); } }}>{p.t('common.reject')}</button>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'attractions' && (
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="card-title mb-0">{p.t('party.attractions')}</h5>
                                        <button className="btn btn-primary btn-sm" onClick={()=>p.setShowAttractionPicker(true)}>
                                            <i className="fa fa-plus me-1"></i> {p.t('common.add')}
                                        </button>
                                    </div>
                                    <AttractionVotingPanel partyId={p.party.id} currentUserId={p.userId ?? 0} onOpenAttraction={setSelectedAttractionId} isOrganizer={p.isOrganizer} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'permissions' && (
                            <PermissionsPanel partyId={p.party.id} participants={p.participants} isOrganizer={p.isOrganizer} />
                        )}

                        {p.activeTab === 'photos' && (
                            <div className="card">
                                <div className="card-body">
                                    <EventMediaPanel eventId={p.party.id} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'comments' && (
                            <div className="card">
                                <div className="card-body">
                                    <EventCommentsPanel eventId={p.party.id} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'scoring' && (
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">{p.t('party.scoring', 'Game Scoring')}</h5>
                                    <GameSessionScoringPanel kind="board" sessionId={p.selectedSessionId ?? 0} eventId={p.party.id} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'dateProposals' && !p.party.startTime && (
                            <div className="card">
                                <div className="card-body">
                                    <DateProposalsPanel eventId={p.party.id} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'billing' && (
                            <div className="card">
                                <div className="card-body">
                                    <EventBillingPanel eventId={p.party.id} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'polls' && (
                            <div className="card">
                                <div className="card-body">
                                    <EventPollsPanel eventId={p.party.id} isOrganizer={p.isOrganizer} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'inviteTemplates' && (
                            <div className="card">
                                <div className="card-body">
                                    <EventInviteTemplatesPanel eventId={p.party.id} isOrganizer={p.isOrganizer} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'collages' && (
                            <div className="card">
                                <div className="card-body">
                                    <EventCollagesPanel eventId={p.party.id} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'gamePicks' && (
                            <div className="card">
                                <div className="card-body">
                                    <GamePicksPanel eventId={p.party.id} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'songPicks' && (
                            <div className="card">
                                <div className="card-body">
                                    <SongPicksPanel eventId={p.party.id} sessionId={p.selectedSessionId ?? 0} />
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'settings' && (
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">{p.t('party.settingsTitle')}</h5>
                                    <PartySettings
                                        isOrganizer={p.isOrganizer}
                                        party={p.party}
                                        updatePartyMutation={p.updatePartyMutation}
                                        normalizeEnumToString={p.normalizeEnumToString}
                                        accessSelection={p.accessSelection}
                                        setAccessSelection={p.setAccessSelection}
                                        startInput={p.startInput}
                                        setStartInput={p.setStartInput}
                                        endInput={p.endInput}
                                        setEndInput={p.setEndInput}
                                    />
                                    {p.updatePartyMutation.isError && <div className="text-danger mt-2">{p.t('party.saveError')}</div>}
                                </div>
                            </div>
                        )}

                        {p.activeTab === 'chat' && (
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">{p.t('party.chat.title')}</h5>
                                </div>
                                <div className="card-body p-0">
                                    <PartyChat
                                        partyId={p.party.id}
                                        username={p.username ?? p.currentUser?.username ?? undefined}
                                        isOpen={p.activeTab === 'chat'}
                                        onCountsChange={({ unread, total }) => {
                                            p.setChatUnread(unread);
                                            p.setChatTotal(total);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                </div>
            </div>



            {p.showAttractionPicker && (
                <div className="modal-backdrop" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1060}} onClick={()=>p.setShowAttractionPicker(false)}>
                    <div className="card shadow-lg" style={{width:'auto',minWidth:340,maxWidth:520,borderRadius:14}} onClick={e=>e.stopPropagation()}>
                        <div className="card-header d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <h5 className="mb-0 fw-semibold">{p.t('party.addAttraction')}</h5>
                            <button className="btn-close" onClick={()=>p.setShowAttractionPicker(false)}></button>
                        </div>
                        <div className="card-body p-0">
                            <AttractionPicker onSelect={p.handleAttractionSelect} onCancel={()=>p.setShowAttractionPicker(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Attraction detail modal */}
            {selectedAttractionId && (
                <AttractionDetailModal
                    partyId={p.party.id}
                    attractionId={selectedAttractionId}
                    onClose={() => setSelectedAttractionId(null)}
                    onAddRound={(sessionId) => {
                        if (sessionId) p.setSelectedSessionId(sessionId);
                        p.setShowAddRound(true);
                    }}
                    isOrganizer={p.isOrganizer}
                />
            )}

            <AddRoundModal
              show={p.showAddRound}
              onClose={() => p.setShowAddRound(false)}
              songs={p.songs as KaraokeSongFile[] | undefined}
              songsLoading={p.songsLoading}
              songIndex={p.songIndex}
              setSongIndex={p.setSongIndex}
              addRoundMutation={p.addRoundMutation}
              party={p.party}
              status={p.status}
              presetSessionId={p.selectedSessionId}
            />
            <PartsModal
                show={p.showPartsModal}
                roundId={p.partsModalRoundId}
                onClose={() => p.setShowPartsModal(false)}
                partsPage={p.partsPage}
                setPartsPage={p.setPartsPage}
                partsPageSize={p.partsPageSize}
                partsSortBy={p.partsSortBy}
                setPartsSortBy={p.setPartsSortBy}
                partsSortDir={p.partsSortDir}
                setPartsSortDir={p.setPartsSortDir}
                editingPartKey={p.editingPartKey}
                setEditingPartKey={p.setEditingPartKey}
                editingPlayerId={p.editingPlayerId}
                setEditingPlayerId={p.setEditingPlayerId}
                newPartNumber={p.newPartNumber}
                setNewPartNumber={p.setNewPartNumber}
                newPartPlayerId={p.newPartPlayerId}
                setNewPartPlayerId={p.setNewPartPlayerId}
                status={p.status}
                participants={p.participants}
                party={p.party}
                userId={p.userId}
                queryClient={p.queryClient}
                addRoundPartMutation={p.addRoundPartMutation}
            />
            <RoundPlayersModal
                show={p.showPlayersModal}
                roundId={p.playersModalRoundId}
                onClose={() => p.setShowPlayersModal(false)}
                party={p.party}
            />
        </div>
        </>
    );
};

export default PartyPage;
