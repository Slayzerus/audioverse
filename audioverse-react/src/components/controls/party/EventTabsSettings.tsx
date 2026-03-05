import React from "react";
import { useTranslation } from "react-i18next";
import type { EventTab } from "../../../models/karaoke/modelsEvent";
import { useEventTabsQuery, useUpsertEventTabMutation, useDeleteEventTabMutation } from "../../../scripts/api/apiEventTabs";
import type { PartyTab } from "./PartyNavbar";

/**
 * Default tab definitions — every tab the system supports.
 * If there is no EventTab override in the DB, the defaults apply.
 * Organizer only saves overrides (deviations from defaults).
 */
interface DefaultTab {
  key: PartyTab;
  icon: string;
  defaultVisibleOrganizer: boolean;
  defaultVisibleParticipant: boolean;
  defaultVisibleGuest: boolean;
}

const DEFAULT_TABS: DefaultTab[] = [
  { key: 'participants',    icon: 'fa-users',          defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: true  },
  { key: 'attractions',     icon: 'fa-gamepad',        defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: true  },
  { key: 'invites',         icon: 'fa-envelope',       defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: false },
  { key: 'chat',            icon: 'fa-comments',       defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: false },
  { key: 'permissions',     icon: 'fa-shield',         defaultVisibleOrganizer: true,  defaultVisibleParticipant: false, defaultVisibleGuest: false },
  { key: 'photos',          icon: 'fa-camera',         defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: true  },
  { key: 'comments',        icon: 'fa-comment',        defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: true  },
  { key: 'scoring',         icon: 'fa-trophy',         defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: true  },
  { key: 'billing',         icon: 'fa-credit-card',    defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: false },
  { key: 'polls',           icon: 'fa-bar-chart',      defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: false },
  { key: 'inviteTemplates', icon: 'fa-file-text',      defaultVisibleOrganizer: true,  defaultVisibleParticipant: false, defaultVisibleGuest: false },
  { key: 'collages',        icon: 'fa-th-large',       defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: true  },
  { key: 'gamePicks',       icon: 'fa-dice',           defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: false },
  { key: 'songPicks',       icon: 'fa-music',          defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: false },
  { key: 'dateProposals',   icon: 'fa-calendar-check', defaultVisibleOrganizer: true,  defaultVisibleParticipant: true,  defaultVisibleGuest: false },
  { key: 'settings',        icon: 'fa-cog',            defaultVisibleOrganizer: true,  defaultVisibleParticipant: false, defaultVisibleGuest: false },
];

interface Props {
  eventId: number;
}

const EventTabsSettings: React.FC<Props> = ({ eventId }) => {
  const { t } = useTranslation();
  const { data: savedTabs = [], isLoading } = useEventTabsQuery(eventId);
  const upsertMutation = useUpsertEventTabMutation(eventId);
  const deleteMutation = useDeleteEventTabMutation(eventId);

  // Build a merged view: defaults + overrides
  const mergedTabs = React.useMemo(() => {
    const overrideMap = new Map<string, EventTab>();
    for (const tab of savedTabs) {
      overrideMap.set(tab.key, tab);
    }
    return DEFAULT_TABS.map(def => {
      const override = overrideMap.get(def.key);
      return {
        key: def.key,
        icon: def.icon,
        overrideId: override?.id ?? null,
        visibleOrganizer: override ? override.visibleOrganizer : def.defaultVisibleOrganizer,
        visibleParticipant: override ? override.visibleParticipant : def.defaultVisibleParticipant,
        visibleGuest: override ? override.visibleGuest : def.defaultVisibleGuest,
        isDefault: !override,
        defaultVisibleOrganizer: def.defaultVisibleOrganizer,
        defaultVisibleParticipant: def.defaultVisibleParticipant,
        defaultVisibleGuest: def.defaultVisibleGuest,
      };
    });
  }, [savedTabs]);

  const handleToggle = (key: string, field: 'visibleOrganizer' | 'visibleParticipant' | 'visibleGuest', newValue: boolean) => {
    const row = mergedTabs.find(r => r.key === key);
    if (!row) return;

    const newVisibleOrganizer = field === 'visibleOrganizer' ? newValue : row.visibleOrganizer;
    const newVisibleParticipant = field === 'visibleParticipant' ? newValue : row.visibleParticipant;
    const newVisibleGuest = field === 'visibleGuest' ? newValue : row.visibleGuest;

    // If the new values match defaults and there's an override → delete it
    if (newVisibleOrganizer === row.defaultVisibleOrganizer
      && newVisibleParticipant === row.defaultVisibleParticipant
      && newVisibleGuest === row.defaultVisibleGuest) {
      if (row.overrideId) {
        deleteMutation.mutate(row.overrideId);
      }
      return;
    }

    // Otherwise upsert (create or update the override)
    upsertMutation.mutate({
      id: row.overrideId ?? 0,
      key,
      name: key,
      sortOrder: DEFAULT_TABS.findIndex(d => d.key === key),
      visibleOrganizer: newVisibleOrganizer,
      visibleParticipant: newVisibleParticipant,
      visibleGuest: newVisibleGuest,
      isEnabled: true,
    });
  };

  if (isLoading) {
    return <div className="text-muted small">{t('common.loading', 'Ładowanie...')}</div>;
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <h6 className="mb-2">
        <i className="fa fa-eye me-2" aria-hidden="true" />
        {t('party.tabs.title', 'Widoczność zakładek')}
      </h6>
      <p className="text-muted small mb-2">
        {t('party.tabs.description', 'Określ, które zakładki widzą organizator, uczestnicy i goście.')}
      </p>
      <div className="table-responsive">
        <table className="table table-sm table-dark table-bordered align-middle mb-0" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>{t('party.tabs.tabName', 'Zakładka')}</th>
              <th className="text-center" style={{ width: '23%' }}>
                <i className="fa fa-star me-1" aria-hidden="true" />
                {t('party.tabs.organizer', 'Organizator')}
              </th>
              <th className="text-center" style={{ width: '23%' }}>
                <i className="fa fa-user me-1" aria-hidden="true" />
                {t('party.tabs.participant', 'Uczestnik')}
              </th>
              <th className="text-center" style={{ width: '24%' }}>
                <i className="fa fa-user-o me-1" aria-hidden="true" />
                {t('party.tabs.guest', 'Gość')}
              </th>
            </tr>
          </thead>
          <tbody>
            {mergedTabs.map(row => (
              <tr key={row.key} style={row.isDefault ? undefined : { background: 'rgba(108, 52, 131, 0.15)' }}>
                <td>
                  <i className={`fa ${row.icon} me-2 text-muted`} aria-hidden="true" />
                  {t(`party.tabs.keys.${row.key}`, row.key)}
                  {!row.isDefault && (
                    <span className="badge bg-info ms-2" style={{ fontSize: '0.65rem' }}>
                      {t('party.tabs.override', 'zmieniono')}
                    </span>
                  )}
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={row.visibleOrganizer}
                    onChange={e => handleToggle(row.key, 'visibleOrganizer', e.target.checked)}
                    disabled={upsertMutation.isPending || deleteMutation.isPending}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={row.visibleParticipant}
                    onChange={e => handleToggle(row.key, 'visibleParticipant', e.target.checked)}
                    disabled={upsertMutation.isPending || deleteMutation.isPending}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={row.visibleGuest}
                    onChange={e => handleToggle(row.key, 'visibleGuest', e.target.checked)}
                    disabled={upsertMutation.isPending || deleteMutation.isPending}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventTabsSettings;
