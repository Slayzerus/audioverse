// EventDetailPage.tsx — Read-only event detail view with tabs
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePartyQuery } from "../../scripts/api/apiKaraoke";
import { useEventPhotosQuery } from "../../scripts/api/apiEventPhotos";
import { useEventCommentsQuery } from "../../scripts/api/apiEventComments";
import { usePollsQuery } from "../../scripts/api/apiEventPolls";
import { useExpensesQuery, useSettlementQuery } from "../../scripts/api/apiEventBilling";
import type { EventPhoto, EventComment, EventExpense } from "../../models/karaoke/modelsEvent";
import {
    EventNotificationLevel,
    EventNotificationCategory,
    useSubscriptionCheckQuery,
    useEventSubscriptionQuery,
    useSubscribeToEventMutation,
    useUnsubscribeMutation,
    useEventSubscribersQuery,
} from "../../scripts/api/apiEventSubscriptions";
import {
    useMyEventListsQuery,
    useEventExistsInListQuery,
    useAddEventToListMutation,
} from "../../scripts/api/apiEventLists";
import s from "./EventDetailPage.module.css";

type Tab = "overview" | "photos" | "comments" | "polls" | "billing" | "subscription" | "lists";

// ── Subscription helpers ─────────────────────────────────────────
const levelLabels: Record<EventNotificationLevel, { label: string; color: string }> = {
    [EventNotificationLevel.Muted]: { label: "Muted", color: "#636e72" },
    [EventNotificationLevel.Essential]: { label: "Essential", color: "#e17055" },
    [EventNotificationLevel.Standard]: { label: "Standard", color: "#0984e3" },
    [EventNotificationLevel.All]: { label: "All", color: "#00b894" },
};
const categoryLabels: { value: EventNotificationCategory; label: string }[] = [
    { value: EventNotificationCategory.Cancellation, label: "Cancellation" },
    { value: EventNotificationCategory.DateTimeChange, label: "Date/Time" },
    { value: EventNotificationCategory.Reminder24h, label: "24h" },
    { value: EventNotificationCategory.Reminder1h, label: "1h" },
    { value: EventNotificationCategory.ScheduleUpdate, label: "Schedule" },
    { value: EventNotificationCategory.NewParticipant, label: "Participants" },
    { value: EventNotificationCategory.News, label: "News" },
    { value: EventNotificationCategory.Comments, label: "Comments" },
    { value: EventNotificationCategory.Polls, label: "Polls" },
    { value: EventNotificationCategory.Media, label: "Media" },
    { value: EventNotificationCategory.GameUpdates, label: "Games" },
];

const EventDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { partyId } = useParams<{ partyId: string }>();
    const id = Number(partyId) || 0;
    const [tab, setTab] = useState<Tab>("overview");

    const { data: party, isLoading: partyLoading } = usePartyQuery(id, { enabled: id > 0 });
    const { data: photosPage } = useEventPhotosQuery(id, 1, 50, { enabled: id > 0 && tab === "photos" });
    const { data: commentsPage } = useEventCommentsQuery(id, 1, 100, { enabled: id > 0 && tab === "comments" });
    const { data: polls } = usePollsQuery(id, { enabled: id > 0 && tab === "polls" });
    const { data: expenses } = useExpensesQuery(id, { enabled: id > 0 && tab === "billing" });
    const { data: settlement } = useSettlementQuery(id);

    // ── Subscription hooks ──
    const { data: isSubscribed } = useSubscriptionCheckQuery(id, { enabled: id > 0 });
    const { data: mySub } = useEventSubscriptionQuery(id, { enabled: id > 0 && tab === "subscription" });
    const { data: subscribers } = useEventSubscribersQuery(id, { enabled: id > 0 && tab === "subscription" });
    const subscribeMut = useSubscribeToEventMutation();
    const unsubscribeMut = useUnsubscribeMutation();

    // ── Add-to-list hooks ──
    const { data: myLists } = useMyEventListsQuery({ enabled: tab === "lists" });
    const [checkListId, setCheckListId] = useState<number>(0);
    const { data: existsInList } = useEventExistsInListQuery(checkListId, id, {
        enabled: checkListId > 0 && id > 0,
    });
    const addToList = useAddEventToListMutation();
    const [addNote, setAddNote] = useState("");

    if (partyLoading) return <div className={s.page}><p>{t("common.loading", "Loading…")}</p></div>;
    if (!party) return <div className={s.page}><p>{t("common.notFound", "Not found.")}</p></div>;

    const photos = photosPage?.items ?? [];
    const comments = commentsPage?.items ?? [];

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: "overview", label: t("eventDetail.overview", "Overview"), icon: "clipboard-list" },
        { key: "photos", label: t("eventDetail.photos", "Photos"), icon: "camera" },
        { key: "comments", label: t("eventDetail.comments", "Comments"), icon: "comments" },
        { key: "polls", label: t("eventDetail.polls", "Polls"), icon: "chart-bar" },
        { key: "billing", label: t("eventDetail.billing", "Billing"), icon: "coins" },
        { key: "subscription", label: isSubscribed ? `✓ ${t("eventDetail.subscribed", "Subscribed")}` : t("eventDetail.subscribe", "Subscribe"), icon: "bell" },
        { key: "lists", label: t("eventDetail.addToList", "Lists"), icon: "list" },
    ];

    return (
        <div className={s.page}>
            {/* Header */}
            <div className={s.headerRow}>
                <Link to={`/parties/${id}`} className={s.backLink}>
                    ← {t("eventDetail.backToEvent", "Back to event")}
                </Link>
            </div>
            <h1 className={s.noMargin}>
                {party.title || party.name || `Event #${party.id}`}
            </h1>

            {/* Tab bar */}
            <div className={s.tabBar}>
                {tabs.map((tb) => (
                    <button key={tb.key} type="button" className={`${s.tabBtn} ${tab === tb.key ? s.tabBtnActive : ""}`} onClick={() => setTab(tb.key)}>
                        <i className={`fa-solid fa-${tb.icon}`} />{" "}{tb.label}
                    </button>
                ))}
            </div>

            {/* ──── Overview tab ──── */}
            {tab === "overview" && (
                <div className={s.card}>
                    <h2 className={s.noMargin}><i className="fa-solid fa-clipboard-list" />{" "}{t("eventDetail.overview", "Overview")}</h2>
                    {party.description && <p className={s.descText}>{party.description}</p>}
                    <div className={s.metaRow}>
                        {party.startTime && (
                            <span><strong><i className="fa-solid fa-calendar" />{" "}{t("eventDetail.start", "Start")}:</strong> {new Date(party.startTime).toLocaleString()}</span>
                        )}
                        {party.endTime && (
                            <span><strong><i className="fa-solid fa-flag-checkered" />{" "}{t("eventDetail.end", "End")}:</strong> {new Date(party.endTime).toLocaleString()}</span>
                        )}
                        {party.locationName && (
                            <span><strong><i className="fa-solid fa-location-dot" />{" "}{t("eventDetail.location", "Location")}:</strong> {party.locationName}</span>
                        )}
                        {party.maxParticipants != null && (
                            <span><strong>👥 Max:</strong> {party.maxParticipants}</span>
                        )}
                    </div>
                    {party.poster && (
                        <img src={party.poster} alt="Event poster" className={s.posterImg} />
                    )}
                </div>
            )}

            {/* ──── Photos tab ──── */}
            {tab === "photos" && (
                <div className={s.card}>
                    <h2 className={s.noMargin}><i className="fa-solid fa-camera" />{" "}{t("eventDetail.photos", "Photos")} ({photos.length})</h2>
                    {photos.length === 0 ? (
                        <p className={s.emptyText}>{t("eventDetail.noPhotos", "No photos.")}</p>
                    ) : (
                        <div className={s.grid}>
                            {photos.map((ph: EventPhoto) => (
                                <div key={ph.id} className={s.photoCard}>
                                    <img
                                        src={ph.objectKey ? `/api/files/${ph.objectKey}` : "/placeholder.png"}
                                        alt={ph.caption || "Photo"}
                                        className={s.photoImg}
                                    />
                                    {ph.caption && <p className={s.photoCaption}>{ph.caption}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ──── Comments tab ──── */}
            {tab === "comments" && (
                <div className={s.card}>
                    <h2 className={s.noMargin}><i className="fa-solid fa-comments" />{" "}{t("eventDetail.comments", "Comments")} ({comments.length})</h2>
                    {comments.length === 0 ? (
                        <p className={s.emptyText}>{t("eventDetail.noComments", "No comments.")}</p>
                    ) : (
                        <div className={s.columnGap8}>
                            {comments.map((c: EventComment) => (
                                <div key={c.id} className={s.commentCard}>
                                    <div className={s.commentHeader}>
                                        <strong>{c.userId ? `User #${c.userId}` : t("eventDetail.anon", "Anonymous")}</strong>
                                        <span className={s.commentDate}>{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className={s.commentText}>{c.text}</p>
                                    {c.replies && c.replies.length > 0 && (
                                        <div className={s.replyList}>
                                            {c.replies.map((r: EventComment) => (
                                                <div key={r.id} className={s.replyCard}>
                                                    <strong>{r.userId ? `User #${r.userId}` : "Anon"}</strong>
                                                    <p className={s.replyText}>{r.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ──── Polls tab ──── */}
            {tab === "polls" && (
                <div className={s.card}>
                    <h2 className={s.noMargin}><i className="fa-solid fa-chart-bar" />{" "}{t("eventDetail.polls", "Polls")} ({polls?.length ?? 0})</h2>
                    {(!polls || polls.length === 0) ? (
                        <p className={s.emptyText}>{t("eventDetail.noPolls", "No polls.")}</p>
                    ) : (
                        <div className={s.columnGap12}>
                            {polls.map((p) => (
                                <div key={p.id} className={s.pollCard}>
                                    <strong>{p.title || `Poll #${p.id}`}</strong>
                                    {p.description && <p className={s.pollDesc}>{p.description}</p>}
                                    <div className={s.pollMeta}>
                                        <span>{t("eventDetail.active", "Active")}: {p.isActive ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-xmark" />}</span>
                                        {p.expiresAt && <span> · {t("eventDetail.expires", "Expires")}: {new Date(p.expiresAt).toLocaleDateString()}</span>}
                                    </div>
                                    {p.options && p.options.length > 0 && (
                                        <ul className={s.pollOptions}>
                                            {p.options.map((o) => (
                                                <li key={o.id}>{o.text || `Option ${o.sortOrder}`}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ──── Billing tab ──── */}
            {tab === "billing" && (
                <div className={s.card}>
                    <h2 className={s.noMargin}><i className="fa-solid fa-coins" />{" "}{t("eventDetail.billing", "Billing")}</h2>

                    <h3 className={s.noMargin}>
                        {t("eventDetail.expenses", "Expenses")} ({expenses?.length ?? 0})
                    </h3>
                    {(!expenses || expenses.length === 0) ? (
                        <p className={s.emptyText}>{t("eventDetail.noExpenses", "No expenses.")}</p>
                    ) : (
                        <table className={s.table}>
                            <thead>
                                <tr className={s.tableHeaderRow}>
                                    <th className={s.cellLeft}>{t("eventDetail.desc", "Description")}</th>
                                    <th className={s.cellRight}>{t("eventDetail.amount", "Amount")}</th>
                                    <th className={s.cellLeft}>{t("eventDetail.paidBy", "Paid by")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((e: EventExpense) => (
                                    <tr key={e.id} className={s.tableRow}>
                                        <td className={s.cellLeft}>{e.description || "-"}</td>
                                        <td className={s.cellAmount}>
                                            {e.amount?.toFixed(2) ?? "-"} {e.currency || "PLN"}
                                        </td>
                                        <td className={s.cellLeft}>{e.paidByUserId ? `User #${e.paidByUserId}` : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {settlement != null && (
                        <>
                            <h3 className={s.settlementTitle}>
                                {t("eventDetail.settlement", "Settlement")}
                            </h3>
                            <pre className={s.settlementPre}>
                                {JSON.stringify(settlement, null, 2)}
                            </pre>
                        </>
                    )}
                </div>
            )}

            {/* ──── Subscription tab ──── */}
            {tab === "subscription" && (
                <div className={s.card}>
                    <h2 className={s.noMargin}><i className="fa-solid fa-bell" />{" "}{t("eventDetail.subscriptionTitle", "Subscription")}</h2>

                    {/* Subscribe / Unsubscribe button */}
                    <div className={s.subActions}>
                        {isSubscribed ? (
                            <>
                                <span className={s.badgeLg} style={{ backgroundColor: "#00b894" }}>
                                    ✓ {t("eventDetail.subscribed", "Subscribed")}
                                </span>
                                <button className={s.btnDanger}
                                    onClick={() => { if (confirm(t("eventDetail.confirmUnsub", "Unsubscribe from this event?"))) unsubscribeMut.mutate(id); }}
                                    disabled={unsubscribeMut.isPending}>
                                    {t("eventDetail.unsubscribe", "Unsubscribe")}
                                </button>
                            </>
                        ) : (
                            <button className={s.btnAccent}
                                onClick={() => subscribeMut.mutate({ eventId: id, level: EventNotificationLevel.Standard, pushEnabled: true })}
                                disabled={subscribeMut.isPending}>
                                <i className="fa-solid fa-bell" />{" "}
                                {subscribeMut.isPending
                                    ? t("common.saving", "Saving…")
                                    : t("eventDetail.subscribeBtn", "Subscribe to notifications")}
                            </button>
                        )}
                    </div>

                    {/* Current subscription details */}
                    {mySub && (
                        <div className={s.subDetails}>
                            <div className={s.subLevelRow}>
                                <strong className={s.subLevelLabel}>{t("eventDetail.level", "Level")}:</strong>
                                <span className={s.badge} style={{ backgroundColor: levelLabels[mySub.level]?.color ?? "#636e72" }}>
                                    {levelLabels[mySub.level]?.label ?? "Unknown"}
                                </span>
                            </div>
                            <div className={s.subChannels}>
                                <span>✉️ {mySub.emailEnabled ? "On" : "Off"}</span>
                                <span><i className="fa-solid fa-bell" /> {mySub.pushEnabled ? "On" : "Off"}</span>
                            </div>
                            {mySub.customCategories != null && mySub.customCategories > 0 && (
                                <div className={s.subCategories}>
                                    {categoryLabels
                                        .filter((c) => (mySub.customCategories! & c.value) !== 0)
                                        .map((c) => (
                                            <span key={c.value} className={s.badge} style={{ backgroundColor: "#5865F2" }}>{c.label}</span>
                                        ))}
                                </div>
                            )}
                            <p className={s.subNote}>
                                {t("eventDetail.manageSubLink", "Manage all subscriptions on")}
                                {" "}
                                <Link to="/my-subscriptions" className={s.subLink}>
                                    {t("eventDetail.subsPage", "My Subscriptions")}
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Subscribers list (organizer view) */}
                    {subscribers && subscribers.length > 0 && (
                        <div className={s.subscribersSection}>
                            <h3 className={s.subscribersTitle}>
                                <i className="fa-solid fa-users" />{" "}
                                {t("eventDetail.subscribers", "Subscribers")} ({subscribers.length})
                            </h3>
                            <table className={s.subscribersTable}>
                                <thead>
                                    <tr className={s.tableHeaderRow}>
                                        <th className={s.cellLeft}>{t("eventDetail.user", "User")}</th>
                                        <th className={s.cellLeft}>{t("eventDetail.level", "Level")}</th>
                                        <th className={s.cellCenter}>✉️</th>
                                        <th className={s.cellCenter}><i className="fa-solid fa-bell" /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((sub) => (
                                        <tr key={sub.id} className={s.tableRow}>
                                            <td className={s.cellLeft}>User #{sub.userId}</td>
                                            <td className={s.cellLeft}>
                                                <span className={s.badge} style={{ backgroundColor: levelLabels[sub.level]?.color ?? "#636e72" }}>
                                                    {levelLabels[sub.level]?.label ?? "?"}
                                                </span>
                                            </td>
                                            <td className={s.cellCenter}>
                                                {sub.emailEnabled ? "✓" : "—"}
                                            </td>
                                            <td className={s.cellCenter}>
                                                {sub.pushEnabled ? "✓" : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ──── Add to List tab ──── */}
            {tab === "lists" && (
                <div className={s.card}>
                    <h2 className={s.noMargin}><i className="fa-solid fa-list" />{" "}{t("eventDetail.addToListTitle", "Add to Event List")}</h2>

                    {!myLists || myLists.length === 0 ? (
                        <p className={s.noListsText}>
                            {t("eventDetail.noLists", "You have no event lists.")}{" "}
                            <Link to="/my-event-lists" className={s.subLink}>
                                {t("eventDetail.createList", "Create one")}
                            </Link>
                        </p>
                    ) : (
                        <div className={s.columnGap10}>
                            {/* List selector with exists check */}
                            <label className={s.labelSm}>
                                {t("eventDetail.selectList", "Select a list")}
                                <select
                                    className={s.selectInput}
                                    value={checkListId}
                                    onChange={(e) => setCheckListId(Number(e.target.value))}
                                >
                                    <option value={0}>— {t("eventDetail.chooselist", "Choose list")} —</option>
                                    {myLists.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.name} ({l.itemCount ?? l.items?.length ?? 0} items)
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {checkListId > 0 && existsInList != null && (
                                <span className={s.labelSm}>
                                    {existsInList
                                        ? <span className={s.existsYes}>✓ {t("eventDetail.alreadyInList", "Event is already in this list")}</span>
                                        : <span className={s.existsNo}>{t("eventDetail.notInList", "Event is not in this list yet")}</span>}
                                </span>
                            )}

                            {/* Note input */}
                            <label className={s.labelSm}>
                                {t("eventDetail.noteOptional", "Note (optional)")}
                                <input
                                    className={s.textInput}
                                    value={addNote}
                                    onChange={(e) => setAddNote(e.target.value)}
                                    placeholder={t("eventDetail.notePlaceholder", "Add a note…")}
                                />
                            </label>

                            {/* Add button */}
                            <button
                                className={s.btnAccent}
                                disabled={!checkListId || existsInList === true || addToList.isPending}
                                onClick={() => {
                                    addToList.mutate({ listId: checkListId, req: { eventId: id, note: addNote || undefined } }, {
                                        onSuccess: () => setAddNote(""),
                                    });
                                }}
                            >
                                {addToList.isPending
                                    ? t("common.saving", "Saving…")
                                    : t("eventDetail.addToListBtn", "Add to list")}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventDetailPage;