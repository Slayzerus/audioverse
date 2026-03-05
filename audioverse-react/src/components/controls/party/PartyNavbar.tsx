import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './partyNavbar.module.css';
import PartyQRCode from './PartyQRCode';
import type { EventTab } from '../../../models/karaoke/modelsEvent';

type PartyTab = 'participants' | 'settings' | 'invites' | 'permissions' | 'attractions' | 'photos' | 'comments' | 'scoring' | 'dateProposals' | 'chat' | 'billing' | 'polls' | 'inviteTemplates' | 'collages' | 'gamePicks' | 'songPicks';
export type { PartyTab };

/** Viewing-as role for the organizer toggle. */
export type ViewAsRole = 'organizer' | 'participant' | 'guest';

const TAB_ORDER: PartyTab[] = [
  'participants', 'attractions', 'invites', 'chat', 'permissions',
  'photos', 'comments', 'scoring', 'billing', 'polls',
  'inviteTemplates', 'collages', 'gamePicks', 'songPicks',
  'dateProposals', 'settings',
];

/** Icon class per tab key */
const TAB_ICONS: Record<PartyTab, string> = {
  participants: 'fa-users',
  attractions: 'fa-gamepad',
  invites: 'fa-envelope',
  chat: 'fa-comments',
  permissions: 'fa-shield',
  photos: 'fa-camera',
  comments: 'fa-comment',
  scoring: 'fa-trophy',
  billing: 'fa-credit-card',
  polls: 'fa-bar-chart',
  inviteTemplates: 'fa-file-text',
  collages: 'fa-th-large',
  gamePicks: 'fa-dice',
  songPicks: 'fa-music',
  dateProposals: 'fa-calendar-check',
  settings: 'fa-cog',
};

/**
 * Default visibility when there's no EventTab override for a given key.
 * Organizer always sees everything — these only control participant/guest views.
 */
const DEFAULT_VISIBILITY: Record<PartyTab, { organizer: boolean; participant: boolean; guest: boolean }> = {
  participants:    { organizer: true,  participant: true,  guest: true  },
  attractions:     { organizer: true,  participant: true,  guest: true  },
  invites:         { organizer: true,  participant: true,  guest: false },
  chat:            { organizer: true,  participant: true,  guest: false },
  permissions:     { organizer: true,  participant: false, guest: false },
  photos:          { organizer: true,  participant: true,  guest: true  },
  comments:        { organizer: true,  participant: true,  guest: true  },
  scoring:         { organizer: true,  participant: true,  guest: true  },
  billing:         { organizer: true,  participant: true,  guest: false },
  polls:           { organizer: true,  participant: true,  guest: false },
  inviteTemplates: { organizer: true,  participant: false, guest: false },
  collages:        { organizer: true,  participant: true,  guest: true  },
  gamePicks:       { organizer: true,  participant: true,  guest: false },
  songPicks:       { organizer: true,  participant: true,  guest: false },
  dateProposals:   { organizer: true,  participant: true,  guest: false },
  settings:        { organizer: true,  participant: false, guest: false },
};

interface Props {
  activeTab: PartyTab;
  setActiveTab: (t: PartyTab) => void;
  participantsCount: number;
  activeCount: number; // active in lobby
  invitesAccepted?: number;
  invitesSent?: number;
  chatUnread?: number;
  chatTotal?: number;
  partyId?: number;
  partyName?: string | null;
  startTime?: string | null;
  /** Tab visibility overrides from the backend (Event.Tabs). */
  eventTabs?: EventTab[];
  /** Whether the current user is the event organizer. */
  isOrganizer?: boolean;
  /** Whether the current user is a participant (RSVP'd). */
  isParticipant?: boolean;
  /** Current view-as role (organizer toggle state). */
  viewAs?: ViewAsRole;
  /** Callback when organizer changes the view-as role. */
  onViewAsChange?: (role: ViewAsRole) => void;
}

const PartyNavbar: React.FC<Props> = ({
  activeTab, setActiveTab, participantsCount, activeCount,
  invitesAccepted, invitesSent, chatUnread = 0, chatTotal: _chatTotal = 0,
  partyId, partyName, startTime,
  eventTabs, isOrganizer = false, isParticipant = false,
  viewAs = 'organizer', onViewAsChange,
}) => {
  const { t } = useTranslation();
  const [qrOpen, setQrOpen] = useState(false);

  // Build override map from eventTabs
  const overrideMap = useMemo(() => {
    const map = new Map<string, EventTab>();
    if (eventTabs) {
      for (const tab of eventTabs) map.set(tab.key, tab);
    }
    return map;
  }, [eventTabs]);

  /** Determine visibility of a tab key for a given role. */
  const isTabVisible = useCallback((key: PartyTab, role: ViewAsRole): boolean => {
    // dateProposals is hidden when startTime is set
    if (key === 'dateProposals' && startTime) return false;

    const override = overrideMap.get(key);
    if (override) {
      return role === 'organizer' ? override.visibleOrganizer
           : role === 'participant' ? override.visibleParticipant
           : override.visibleGuest;
    }
    const def = DEFAULT_VISIBILITY[key];
    return role === 'organizer' ? def.organizer
         : role === 'participant' ? def.participant
         : def.guest;
  }, [overrideMap, startTime]);

  /** Effective role: organizer can toggle; non-organizers see their actual role. */
  const effectiveRole: ViewAsRole = useMemo(() => {
    if (isOrganizer) return viewAs;
    if (isParticipant) return 'participant';
    return 'guest';
  }, [isOrganizer, isParticipant, viewAs]);

  /** Visible tabs in the correct order. */
  const visibleTabs = useMemo(
    () => TAB_ORDER.filter(key => isTabVisible(key, effectiveRole)),
    [effectiveRole, isTabVisible],
  );

  // Listen for LB/RB (Ctrl+Left/Right) tab cycling from GamepadNavigationContext
  const handleTabCycle = useCallback((e: Event) => {
    const detail = (e as CustomEvent<{ direction: number }>).detail;
    if (!detail) return;
    const currentIdx = visibleTabs.indexOf(activeTab);
    let nextIdx = currentIdx + detail.direction;
    if (nextIdx < 0) nextIdx = visibleTabs.length - 1;
    if (nextIdx >= visibleTabs.length) nextIdx = 0;
    setActiveTab(visibleTabs[nextIdx]);
  }, [activeTab, setActiveTab, visibleTabs]);

  useEffect(() => {
    window.addEventListener('party-tab-cycle', handleTabCycle);
    return () => window.removeEventListener('party-tab-cycle', handleTabCycle);
  }, [handleTabCycle]);

  // If active tab became invisible after role change, switch to first visible
  useEffect(() => {
    if (!visibleTabs.includes(activeTab) && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab, setActiveTab]);

  /** Render a badge for a tab (participants count, invites, unread chat). */
  const renderBadge = (key: PartyTab) => {
    if (key === 'participants' && participantsCount > 0)
      return <div className={styles['av-party-badge']}>{activeCount}/{participantsCount}</div>;
    if (key === 'invites' && (invitesSent ?? 0) > 0)
      return <div className={styles['av-party-badge']}>{(invitesAccepted ?? 0)}/{(invitesSent ?? 0)}</div>;
    if (key === 'chat' && chatUnread > 0)
      return <div className={`${styles['av-party-badge']} ${styles['unread']}`}>{chatUnread}</div>;
    return null;
  };

  /** Title text for a tab. */
  const tabTitle = (key: PartyTab): string => {
    const titleKeys: Record<string, string> = {
      participants: 'party.participants',
      attractions: 'party.attractions',
      invites: 'party.invites',
      chat: 'party.chat.title',
      permissions: 'party.permissions.title',
      photos: 'party.photos',
      comments: 'party.comments',
      scoring: 'party.scoring',
      billing: 'party.billing',
      polls: 'party.polls',
      inviteTemplates: 'party.inviteTemplates',
      collages: 'party.collages',
      gamePicks: 'party.gamePicks',
      songPicks: 'party.songPicks',
      dateProposals: 'party.dateProposals',
      settings: 'party.settingsTitle',
    };
    return t(titleKeys[key] ?? key, key);
  };

  return (
    <div className={styles['av-party-navbar']} style={{ position: 'relative' }}>
      {/* ── Organizer: view-as toggle ── */}
      {isOrganizer && onViewAsChange && (
        <div
          className={`${styles['av-party-tab']}`}
          title={t('party.tabs.viewAs', 'Widok jako...')}
          onClick={() => {
            const roles: ViewAsRole[] = ['organizer', 'participant', 'guest'];
            const idx = roles.indexOf(viewAs);
            onViewAsChange(roles[(idx + 1) % roles.length]);
          }}
          style={{ borderRight: '2px solid rgba(255,255,255,0.15)', marginRight: 2 }}
        >
          <i className={`fa ${viewAs === 'organizer' ? 'fa-star' : viewAs === 'participant' ? 'fa-user' : 'fa-user-o'}`} aria-hidden="true" />
          <div className={styles['av-party-badge']} style={{ fontSize: '0.55rem', minWidth: 'auto', padding: '0 3px' }}>
            {viewAs === 'organizer'
              ? t('party.tabs.roleOrganizer', 'Org')
              : viewAs === 'participant'
                ? t('party.tabs.roleParticipant', 'Ucz')
                : t('party.tabs.roleGuest', 'Gość')}
          </div>
        </div>
      )}

      {/* ── Tab buttons ── */}
      {visibleTabs.map(key => (
        <div
          key={key}
          className={`${styles['av-party-tab']} ${activeTab === key ? styles['active'] : ''}`}
          title={tabTitle(key)}
          onClick={() => setActiveTab(key)}
        >
          <i className={`fa ${TAB_ICONS[key]}`} aria-hidden="true" />
          {renderBadge(key)}
        </div>
      ))}

      {/* QR code icon + slide-out */}
      {partyId != null && (
        <>
          <div
            className={`${styles['av-party-tab']} ${qrOpen ? styles['active'] : ''}`}
            title={t('party.showQR', 'Pokaż QR')}
            onClick={() => setQrOpen(v => !v)}
          >
            <i className="fa fa-qrcode" aria-hidden="true"></i>
          </div>
          <PartyQRCode partyId={partyId} partyName={partyName} open={qrOpen} onClose={() => setQrOpen(false)} />
        </>
      )}
    </div>
  );
}

export default PartyNavbar;
