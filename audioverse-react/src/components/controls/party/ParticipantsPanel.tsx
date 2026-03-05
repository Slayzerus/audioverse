import React from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfilePlayer, KaraokeParty, EventPlayerStatus, EventAccessType, type EventParticipant } from "../../../models/modelsKaraoke";
import { CurrentUserResponse, getUserPhotoUrl } from "../../../scripts/api/apiUser";
import { RTCService } from "../../../services/rtcService";
import type { UseMutationResult } from "@tanstack/react-query";
import type { RsvpResponse } from "../../../scripts/api/apiEvents";

interface LobbyMember {
  ConnectionId?: string;
  connectionId?: string;
  Username?: string;
  username?: string;
}

/** Minimal participant shape — compatible with both KaraokePlayer and UserProfilePlayer */
type ParticipantPlayer = {
  id: number;
  name?: string | null;
  color?: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
};

interface Props {
  participants: ParticipantPlayer[];
  participantsRaw: EventParticipant[];
  userProfileIds: number[];
  alreadyJoined: boolean;
  assignPlayerMutation: {
    mutate: (vars: { eventId: number; participant: Partial<EventParticipant> }) => void;
    isPending: boolean;
  };
  rsvpMutation: UseMutationResult<RsvpResponse, unknown, { eventId: number; userId: number }>;
  arriveMutation: UseMutationResult<RsvpResponse, unknown, { eventId: number; userId: number }>;
  cancelParticipationMutation: UseMutationResult<void, unknown, { eventId: number; userId?: number }>;
  party: KaraokeParty;
  userId: number | null | undefined;
  lobbyMode: 'participants' | 'spectators';
  setLobbyMode: (m: 'participants' | 'spectators') => void;
  lobbyMembers: LobbyMember[];
  rtc: {
    service: RTCService;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    connected: boolean;
  };
  username: string | undefined;
  currentUser: CurrentUserResponse | null;
  setLobbyMembers?: (m: LobbyMember[]) => void;
}

/** Resolve an integer status from the possibly-string-or-number-or-enum value */
const resolveStatus = (raw?: EventPlayerStatus | number | string | null): EventPlayerStatus => {
  if (raw == null) return EventPlayerStatus.Registered;
  if (typeof raw === 'number') return raw as EventPlayerStatus;
  const n = Number(raw);
  if (!Number.isNaN(n)) return n as EventPlayerStatus;
  // Handle string enum names (backend serializes as string)
  const map: Record<string, EventPlayerStatus> = {
    registered: EventPlayerStatus.Registered,
    waiting: EventPlayerStatus.Waiting,
    validation: EventPlayerStatus.Validation,
    inside: EventPlayerStatus.Inside,
    outside: EventPlayerStatus.Outside,
    left: EventPlayerStatus.Left,
    cancelled: EventPlayerStatus.Cancelled,
  };
  return map[String(raw).toLowerCase()] ?? EventPlayerStatus.Registered;
};

/**
 * Pick the display name based on event access type.
 * NOTE: `user` here is a UserProfile (from EventParticipant.User), NOT a UserProfilePlayer.
 * The backend sends fullName + userName from IdentityUser. The fetchEventParticipants
 * normalizer copies these into name/displayName, but we handle both shapes defensively.
 */
const getDisplayName = (user: UserProfilePlayer | null | undefined, access?: EventAccessType, participantUserId?: number): string => {
  if (!user) return participantUserId ? `Uczestnik #${participantUserId}` : '?';
  const raw = user as unknown as Record<string, unknown>;
  // Trim strings — empty string should not count as a value
  const fullName = (typeof raw.fullName === 'string' ? raw.fullName.trim() : null) || null;
  const userName = (typeof raw.userName === 'string' ? raw.userName.trim() : null) || null;
  const name = (user.name?.trim()) || fullName || null;
  const displayName = (user.displayName?.trim()) || fullName || null;
  // For private events, prefer displayName (full name); for public, prefer name
  let result: string;
  if (access === EventAccessType.Private) {
    result = displayName || name || userName || `#${user.id}`;
  } else {
    result = name || displayName || userName || `#${user.id}`;
  }
  return result;
};

/** Badge color based on status */
const statusBadge = (status: EventPlayerStatus): { bg: string; label: string } => {
  switch (status) {
    case EventPlayerStatus.Registered:
      return { bg: 'primary', label: 'Zapisany' };
    case EventPlayerStatus.Waiting:
      return { bg: 'warning text-dark', label: 'Oczekuje' };
    case EventPlayerStatus.Validation:
      return { bg: 'info text-dark', label: 'Weryfikacja' };
    case EventPlayerStatus.Inside:
      return { bg: 'success', label: 'Na miejscu' };
    case EventPlayerStatus.Outside:
      return { bg: 'secondary', label: 'Na zewnątrz' };
    case EventPlayerStatus.Left:
      return { bg: 'dark', label: 'Wyszedł' };
    case EventPlayerStatus.Cancelled:
      return { bg: 'dark', label: 'Anulowany' };
    default:
      return { bg: 'secondary', label: 'Brak' };
  }
};

const ParticipantsPanel: React.FC<Props> = ({
  participants,
  participantsRaw,
  userProfileIds,
  alreadyJoined,
  assignPlayerMutation,
  rsvpMutation,
  arriveMutation,
  cancelParticipationMutation,
  party,
  userId,
  rtc,
}) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [_errorClosing, setErrorClosing] = React.useState(false);
  const [_successClosing, setSuccessClosing] = React.useState(false);
  const [imgErrors, setImgErrors] = React.useState<Set<number>>(() => new Set());

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setErrorClosing(true);
        setTimeout(() => { setError(null); setErrorClosing(false); }, 260);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccessClosing(true);
        setTimeout(() => { setSuccess(null); setSuccessClosing(false); }, 260);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const eventId = (party as unknown as { eventId?: number }).eventId ?? party.id;
  const access = party.access;

  // Split participants by status category
  const registered = participantsRaw.filter(pp => resolveStatus(pp.status) === EventPlayerStatus.Registered);
  const arrived = participantsRaw.filter(pp => {
    const s = resolveStatus(pp.status);
    return s === EventPlayerStatus.Waiting || s === EventPlayerStatus.Validation || s === EventPlayerStatus.Inside;
  });
  // Catch-all: participants with status Outside, Cancelled, or any other value not in the above
  const others = participantsRaw.filter(pp => {
    const s = resolveStatus(pp.status);
    return s !== EventPlayerStatus.Registered
      && s !== EventPlayerStatus.Waiting
      && s !== EventPlayerStatus.Validation
      && s !== EventPlayerStatus.Inside
      && s !== EventPlayerStatus.Left
      && s !== EventPlayerStatus.Cancelled;
  });

  // Current user's participant entry (to determine which buttons to show)
  const myEntry = participantsRaw.find(pp =>
    userProfileIds.includes(pp.userId) || (pp.user && userProfileIds.includes(pp.user.id))
  );
  const myStatus = myEntry ? resolveStatus(myEntry.status) : null;
  // RSVP/Arrive use userId (users join events; players join sessions/rounds)
  const myUserId = userId ?? userProfileIds.find(pid => typeof pid === 'number');

  const handleRsvp = () => {
    if (myUserId != null && eventId) {
      rsvpMutation.mutate({ eventId, userId: myUserId }, {
        onSuccess: () => setSuccess(t('party.rsvpSuccess', 'Zapisano na wydarzenie!')),
        onError: () => setError(t('party.rsvpError', 'Nie udało się zapisać.')),
      });
    }
  };

  const handleArrive = () => {
    if (myUserId != null && eventId) {
      arriveMutation.mutate({ eventId, userId: myUserId }, {
        onSuccess: () => setSuccess(t('party.arriveSuccess', 'Zgłoszono przybycie!')),
        onError: () => setError(t('party.arriveError', 'Nie udało się zgłosić przybycia.')),
      });
    }
  };

  const handleCancel = () => {
    if (eventId) {
      cancelParticipationMutation.mutate({ eventId }, {
        onSuccess: () => setSuccess(t('party.cancelSuccess', 'Anulowano uczestnictwo.')),
        onError: () => setError(t('party.cancelError', 'Nie udało się anulować.')),
      });
    }
  };

  const handleImgError = React.useCallback((playerId: number) => {
    setImgErrors(prev => { const next = new Set(prev); next.add(playerId); return next; });
  }, []);

  /** Render a single participant card */
  const renderCard = (pp: EventParticipant) => {
    const user = pp.user;
    const participantUserId = pp.userId ?? user?.id ?? 0;
    const isSelf = userProfileIds.includes(participantUserId) || (user ? userProfileIds.includes(user.id) : false);
    const name = getDisplayName(user, access, participantUserId);
    const status = resolveStatus(pp.status);
    const badge = statusBadge(status);
    // Use the user profile photo endpoint (NOT player photo) — participants are users, not players
    const photoUrl = user?.photoUrl || (participantUserId ? getUserPhotoUrl(participantUserId) : null);
    const showPhoto = photoUrl && !imgErrors.has(participantUserId);

    return (
      <motion.div
        key={`card-${participantUserId}`}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="col"
      >
        <div className={`card h-100 text-center${isSelf ? ' border-primary border-2' : ''}`} style={{ minWidth: 140, maxWidth: 180 }}>
          <div className="card-body p-3 d-flex flex-column align-items-center">
            {/* Photo / avatar placeholder */}
            <div
              className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center mb-2"
              style={{
                width: 72, height: 72,
                backgroundColor: showPhoto ? 'transparent' : (user?.color || '#6c757d'),
              }}
            >
              {showPhoto ? (
                <img
                  src={photoUrl!}
                  alt={name}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  onError={() => handleImgError(participantUserId)}
                />
              ) : (
                <i className="fa-solid fa-user text-white" style={{ fontSize: 32 }} />
              )}
            </div>
            {/* Name */}
            <h6 className="card-title mb-1 text-truncate w-100" title={name}>{name}</h6>
            {/* Status badge */}
            <span className={`badge bg-${badge.bg} mt-auto`}>{badge.label}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Determine which action buttons the current user should see
  const isNotParticipant = !alreadyJoined && myStatus == null;
  const showRsvpButton = isNotParticipant;
  // Allow "I'm here" for Registered (RSVP flow)
  const showArriveButton = myStatus === EventPlayerStatus.Registered;
  const showCancelButton = myStatus === EventPlayerStatus.Registered || myStatus === EventPlayerStatus.Waiting;
  const anyMutationPending = rsvpMutation.isPending || arriveMutation.isPending || cancelParticipationMutation.isPending;

  return (
    <div className="card mb-4 position-relative">
      {/* Alerts */}
      <div className="position-absolute top-0 end-0 p-2" style={{ zIndex: 1050 }}>
        <AnimatePresence>
          {error && (
            <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: 'spring', stiffness: 450, damping: 28 }}>
              <div className="alert alert-danger d-flex align-items-center py-1 px-2 mb-2" role="alert">
                <i className="fa fa-exclamation-circle me-2 text-danger" aria-hidden="true"></i>
                <div className="small flex-grow-1">{error}</div>
                <button type="button" className="btn-close btn-sm ms-2" aria-label={t('common.close', 'Close')} onClick={() => { setErrorClosing(true); setTimeout(() => setError(null), 260); }}></button>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
              <div className="alert alert-success d-flex align-items-center py-1 px-2 mb-2" role="alert">
                <i className="fa fa-check-circle me-2 text-success" aria-hidden="true"></i>
                <div className="small flex-grow-1">{success}</div>
                <button type="button" className="btn-close btn-sm ms-2" aria-label={t('common.close', 'Close')} onClick={() => { setSuccessClosing(true); setTimeout(() => setSuccess(null), 260); }}></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">{t('party.participants')}</h5>
          <div className="d-flex align-items-center gap-2">
            {/* RTC status icon */}
            <i
              className="fa-solid fa-tower-broadcast"
              style={{ fontSize: 16, color: rtc?.connected ? '#22c55e' : '#ef4444' }}
              title={rtc?.connected ? t('party.rtcConnected') : t('party.rtcDisconnected')}
              aria-label={rtc?.connected ? t('party.rtcConnected') : t('party.rtcDisconnected')}
            />
            {/* Legacy join (for backwards compat when RSVP not available) */}
            {!alreadyJoined && !showRsvpButton && (
              <button
                className="btn btn-sm btn-success"
                onClick={() => {
                  const joinId = userProfileIds.find(pid => typeof pid === "number");
                  if (typeof joinId === "number") {
                    assignPlayerMutation.mutate({ eventId, participant: { userId: joinId } });
                  }
                }}
                disabled={assignPlayerMutation.isPending || userProfileIds.every(pid => typeof pid !== "number")}
              >
                {assignPlayerMutation.isPending ? t('party.joining') : t('party.join', 'Join')}
              </button>
            )}
          </div>
        </div>

        {/* Action buttons for current user */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {showRsvpButton && (
            <button className="btn btn-primary" onClick={handleRsvp} disabled={anyMutationPending || !myUserId}>
              <i className="fa-solid fa-calendar-check me-1" />
              {rsvpMutation.isPending ? t('common.saving', 'Zapisuję...') : t('party.rsvp', 'Zapisz się')}
            </button>
          )}
          {showArriveButton && (
            <button className="btn btn-success" onClick={handleArrive} disabled={anyMutationPending}>
              <i className="fa-solid fa-location-dot me-1" />
              {arriveMutation.isPending ? t('party.arriving', 'Zgłaszam...') : t('party.imHere', 'Jestem na miejscu')}
            </button>
          )}
          {showCancelButton && (
            <button className="btn btn-outline-danger btn-sm" onClick={handleCancel} disabled={anyMutationPending}>
              <i className="fa-solid fa-xmark me-1" />
              {cancelParticipationMutation.isPending ? t('common.cancelling', 'Anuluję...') : t('party.cancelParticipation', 'Anuluj')}
            </button>
          )}
        </div>

        {/* Arrived section */}
        {arrived.length > 0 && (
          <div className="mb-4">
            <h6 className="text-success mb-2">
              <i className="fa-solid fa-circle-check me-1" />
              {t('party.arrived', 'Na miejscu')} ({arrived.length})
            </h6>
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
              <AnimatePresence>
                {arrived.map(renderCard)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Registered section */}
        {registered.length > 0 && (
          <div className="mb-3">
            <h6 className="text-primary mb-2">
              <i className="fa-solid fa-clipboard-list me-1" />
              {t('party.registered', 'Zapisani')} ({registered.length})
            </h6>
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
              <AnimatePresence>
                {registered.map(renderCard)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Other participants (status None, Outside, etc.) */}
        {others.length > 0 && (
          <div className="mb-3">
            {/* Show a sub-header only when there are also registered/arrived sections */}
            {(registered.length > 0 || arrived.length > 0) && (
              <h6 className="text-secondary mb-2">
                <i className="fa-solid fa-users me-1" />
                {t('party.otherParticipants', 'Uczestnicy')} ({others.length})
              </h6>
            )}
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
              <AnimatePresence>
                {others.map(renderCard)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state */}
        {participantsRaw.length === 0 && participants.length === 0 && (
          <p className="text-muted mb-0">{t('party.noParticipants')}</p>
        )}

        {/* Fallback: legacy list for participants not in participantsRaw (e.g. from party status) */}
        {participantsRaw.length === 0 && participants.length > 0 && (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
            {participants.map((player: ParticipantPlayer, idx: number) => {
              const key = typeof player.id === 'number' ? `legacy-${player.id}` : `legacy-${idx}`;
              const photoUrl = player.photoUrl || (player.id ? getUserPhotoUrl(player.id) : null);
              const showPhoto = photoUrl && !imgErrors.has(player.id);
              return (
                <div key={key} className="col">
                  <div className="card h-100 text-center" style={{ minWidth: 140, maxWidth: 180 }}>
                    <div className="card-body p-3 d-flex flex-column align-items-center">
                      <div
                        className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center mb-2"
                        style={{ width: 72, height: 72, backgroundColor: showPhoto ? 'transparent' : (player.color || '#6c757d') }}
                      >
                        {showPhoto ? (
                          <img src={photoUrl!} alt={player.name ?? ''} className="w-100 h-100" style={{ objectFit: 'cover' }} onError={() => handleImgError(player.id)} />
                        ) : (
                          <i className="fa-solid fa-user text-white" style={{ fontSize: 32 }} />
                        )}
                      </div>
                      <h6 className="card-title mb-1 text-truncate w-100">{player.name || player.displayName || `#${player.id}`}</h6>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ParticipantsPanel);
