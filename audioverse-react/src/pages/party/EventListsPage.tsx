// EventListsPage.tsx — User's event lists management page
import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    EventList,
    EventListItem,
    EventListType,
    EventListVisibility,
    CreateEventListRequest,
    useMyEventListsQuery,
    usePublicEventListsQuery,
    useCreateEventListMutation,
    useUpdateEventListMutation,
    useDeleteEventListMutation,
    useAddEventToListMutation,
    useRemoveEventListItemMutation,
    useUpdateEventListItemMutation,
    useToggleFavoriteMutation,
    useEventListByIdQuery,
    useMoveEventsMutation,
    useCopyEventsMutation,
    useReorderEventListItemsMutation,
    useBulkAddEventsMutation,
    useBulkRemoveEventsMutation,
} from "../../scripts/api/apiEventLists";
import {
    useSetObservedMutation,
    useSubscribeToListMutation,
} from "../../scripts/api/apiEventSubscriptions";
import css from './EventListsPage.module.css';

// ── Helpers ─────────────────────────────────────────────────────────
const typeLabel = (t: EventListType): string =>
    ["Custom", "Favorites", "Watched", "ByLocation", "ByCategory", "Archive"][t] ?? "Custom";
const visLabel = (v: EventListVisibility): string =>
    ["Private", "Shared", "Public"][v] ?? "Private";
const typeBgColor = (t: EventListType): string =>
    ["#5865F2", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#7f8c8d"][t] ?? "#5865F2";
const visBgColor = (v: EventListVisibility): string =>
    ["#636e72", "#3498db", "#2ecc71"][v] ?? "#636e72";

// ── Create / Edit Modal ─────────────────────────────────────────────
interface ListModalProps {
    initial?: Partial<CreateEventListRequest>;
    title: string;
    onSave: (data: CreateEventListRequest) => void;
    onClose: () => void;
}
const ListModal: React.FC<ListModalProps> = ({ initial, title, onSave, onClose }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [type, setType] = useState<EventListType>(initial?.type ?? EventListType.Custom);
    const [visibility, setVisibility] = useState<EventListVisibility>(
        initial?.visibility ?? EventListVisibility.Private,
    );
    const [iconKey, setIconKey] = useState(initial?.iconKey ?? "list");
    const [color, setColor] = useState(initial?.color ?? "#5865F2");

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), description: description.trim() || undefined, type, visibility, iconKey, color });
    };

    return (
        <div className={css.overlay} onClick={onClose}>
            <div className={css.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={css.modalTitle}>{title}</h3>
                <label>
                    {t("eventLists.name", "Name")}
                    <input className={css.input} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </label>
                <label>
                    {t("eventLists.description", "Description")}
                    <textarea className={css.textarea}
                        value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <label>
                    {t("eventLists.type", "Type")}
                    <select className={css.input} value={type} onChange={(e) => setType(Number(e.target.value))}>
                        {Object.entries(EventListType).filter(([, v]) => typeof v === "number").map(([k, v]) => (
                            <option key={v as number} value={v as number}>{k}</option>
                        ))}
                    </select>
                </label>
                <label>
                    {t("eventLists.visibility", "Visibility")}
                    <select className={css.input} value={visibility} onChange={(e) => setVisibility(Number(e.target.value))}>
                        {Object.entries(EventListVisibility).filter(([, v]) => typeof v === "number").map(([k, v]) => (
                            <option key={v as number} value={v as number}>{k}</option>
                        ))}
                    </select>
                </label>
                <div className={css.iconColorRow}>
                    <label className={css.flexOne}>
                        {t("eventLists.iconKey", "FA Icon")}
                        <input className={css.input} value={iconKey} onChange={(e) => setIconKey(e.target.value)}
                            placeholder="e.g. star, music, heart" />
                    </label>
                    <label className={css.flexOne}>
                        {t("eventLists.color", "Color")}
                        <input className={css.input} type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                    </label>
                </div>
                {iconKey && (
                    <div className={css.iconPreview}>
                        {t("eventLists.preview", "Preview:")}{" "}
                        <i className={`fa-solid fa-${iconKey}`} style={{ fontSize: 18, color }} />
                    </div>
                )}
                <div className={css.modalActions}>
                    <button className={css.btn} onClick={onClose}>{t("common.cancel", "Cancel")}</button>
                    <button className={css.btnAccent} onClick={handleSave} disabled={!name.trim()}>
                        {t("common.save", "Save")}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── List Detail (inline expanded) ───────────────────────────────────
interface ListDetailProps {
    listId: number;
    allLists: EventList[];
}
const ListDetail: React.FC<ListDetailProps> = ({ listId, allLists }) => {
    const { t } = useTranslation();
    const { data: list, isLoading } = useEventListByIdQuery(listId);
    const removeItem = useRemoveEventListItemMutation();
    const updateItem = useUpdateEventListItemMutation();
    const addEvent = useAddEventToListMutation();
    const setObserved = useSetObservedMutation();
    const moveEvents = useMoveEventsMutation();
    const copyEvents = useCopyEventsMutation();
    const reorder = useReorderEventListItemsMutation();
    const bulkAdd = useBulkAddEventsMutation();
    const bulkRemove = useBulkRemoveEventsMutation();
    const subscribeToList = useSubscribeToListMutation();

    const [addEventId, setAddEventId] = useState("");
    const [addNote, setAddNote] = useState("");
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editNote, setEditNote] = useState("");
    const [editTags, setEditTags] = useState("");
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkAction, setBulkAction] = useState<"move" | "copy" | "remove">("move");
    const [targetListId, setTargetListId] = useState<number>(0);
    const [bulkAddIds, setBulkAddIds] = useState("");

    const items = useMemo(() => [...(list?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [list?.items]);

    const toggleSelect = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleAdd = () => {
        const eid = Number(addEventId);
        if (!eid) return;
        addEvent.mutate({ listId, req: { eventId: eid, note: addNote || undefined } });
        setAddEventId("");
        setAddNote("");
    };

    const handleEditSave = (item: EventListItem) => {
        updateItem.mutate({ itemId: item.id, req: { note: editNote, tags: editTags }, listId });
        setEditingItemId(null);
    };

    const handleBulk = () => {
        const eventIds = items.filter((i) => selected.has(i.id)).map((i) => i.eventId);
        if (!eventIds.length) return;
        if (bulkAction === "remove") {
            bulkRemove.mutate({ listId, req: { eventIds } });
        } else if (bulkAction === "move" && targetListId) {
            moveEvents.mutate({ sourceListId: listId, targetListId, eventIds });
        } else if (bulkAction === "copy" && targetListId) {
            copyEvents.mutate({ sourceListId: listId, targetListId, eventIds });
        }
        setSelected(new Set());
    };

    const handleBulkAdd = () => {
        const ids = bulkAddIds.split(",").map((s) => Number(s.trim())).filter((n) => n > 0);
        if (!ids.length) return;
        bulkAdd.mutate({ listId, req: { eventIds: ids } });
        setBulkAddIds("");
    };

    const handleMoveUp = (idx: number) => {
        if (idx === 0) return;
        const ids = items.map((i) => i.id);
        [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
        reorder.mutate({ listId, orderedItemIds: ids });
    };
    const handleMoveDown = (idx: number) => {
        if (idx >= items.length - 1) return;
        const ids = items.map((i) => i.id);
        [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
        reorder.mutate({ listId, orderedItemIds: ids });
    };

    if (isLoading) return <p>{t("common.loading", "Loading…")}</p>;
    if (!list) return <p>{t("common.notFound", "List not found")}</p>;

    const otherLists = allLists.filter((l) => l.id !== listId);

    return (
        <div className={css.detailContainer}>
            {/* Header */}
            <div className={css.detailHeader}>
                <strong className={css.detailName}>{list.name}</strong>
                {list.description && <span className={css.detailDescription}>— {list.description}</span>}
                {list.visibility === EventListVisibility.Shared && list.shareToken && (
                    <span className={css.shareLink}>
                        {t("eventLists.shareLink", "Share link:")} /shared/{list.shareToken}
                    </span>
                )}
            </div>

            {/* Items table */}
            {items.length > 0 ? (
                <table className={css.table}>
                    <thead>
                        <tr>
                            <th className={css.th}></th>
                            <th className={css.th}>{t("eventLists.event", "Event")}</th>
                            <th className={css.th}>{t("eventLists.note", "Note")}</th>
                            <th className={css.th}>{t("eventLists.tags", "Tags")}</th>
                            <th className={css.th}>{t("eventLists.observed", "Observed")}</th>
                            <th className={css.th}>{t("eventLists.actions", "Actions")}</th>
                            <th className={css.th}>{t("eventLists.order", "Order")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={item.id}>
                                <td className={css.td}>
                                    <input type="checkbox" checked={selected.has(item.id)}
                                        onChange={() => toggleSelect(item.id)} />
                                </td>
                                <td className={css.td}>#{item.eventId}</td>
                                <td className={css.td}>
                                    {editingItemId === item.id ? (
                                        <input className={css.inputNarrow} value={editNote}
                                            onChange={(e) => setEditNote(e.target.value)} />
                                    ) : (
                                        item.note || "—"
                                    )}
                                </td>
                                <td className={css.td}>
                                    {editingItemId === item.id ? (
                                        <input className={css.inputMedium} value={editTags}
                                            onChange={(e) => setEditTags(e.target.value)} />
                                    ) : (
                                        item.tags || "—"
                                    )}
                                </td>
                                <td className={css.td}>
                                    <button className={item.isObserved ? css.btnAccent : css.btn}
                                        onClick={() => setObserved.mutate({
                                            itemId: item.id,
                                            req: { isObserved: !item.isObserved },
                                        })}>
                                        {item.isObserved
                                            ? t("eventLists.observedYes", "✓ Observed")
                                            : t("eventLists.observedNo", "Not observed")}
                                    </button>
                                </td>
                                <td className={css.td}>
                                    {editingItemId === item.id ? (
                                        <div className={css.flexGap4}>
                                            <button className={css.btnAccent} onClick={() => handleEditSave(item)}>
                                                {t("common.save", "Save")}
                                            </button>
                                            <button className={css.btn} onClick={() => setEditingItemId(null)}>
                                                {t("common.cancel", "Cancel")}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={css.flexGap4}>
                                            <button className={css.btn} onClick={() => {
                                                setEditingItemId(item.id);
                                                setEditNote(item.note ?? "");
                                                setEditTags(item.tags ?? "");
                                            }}>✏️</button>
                                            <button className={css.btn} onClick={() => removeItem.mutate({ itemId: item.id, listId })}>
                                                <i className="fa-solid fa-trash" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className={css.td}>
                                    <button className={css.btn} disabled={idx === 0} onClick={() => handleMoveUp(idx)}>▲</button>
                                    <button className={css.btn} disabled={idx === items.length - 1} onClick={() => handleMoveDown(idx)}>▼</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className={css.noItemsText}>{t("eventLists.noItems", "No items in this list.")}</p>
            )}

            {/* Bulk actions */}
            {selected.size > 0 && (
                <div className={css.bulkActionsRow}>
                    <span>{selected.size} {t("eventLists.selected", "selected")}</span>
                    <select className={css.selectBulkAction} value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value as "move" | "copy" | "remove")}>
                        <option value="move">{t("eventLists.move", "Move")}</option>
                        <option value="copy">{t("eventLists.copy", "Copy")}</option>
                        <option value="remove">{t("eventLists.remove", "Remove")}</option>
                    </select>
                    {bulkAction !== "remove" && (
                        <select className={css.selectTargetList} value={targetListId}
                            onChange={(e) => setTargetListId(Number(e.target.value))}>
                            <option value={0}>— {t("eventLists.targetList", "target list")} —</option>
                            {otherLists.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    )}
                    <button className={css.btnAccent} onClick={handleBulk}>
                        {t("eventLists.applyBulk", "Apply")}
                    </button>
                </div>
            )}

            {/* Add event search bar */}
            <div className={css.actionRow}>
                <input className={css.inputNarrow} type="number" placeholder={t("eventLists.eventId", "Event ID")}
                    value={addEventId} onChange={(e) => setAddEventId(e.target.value)} />
                <input className={css.inputNote} placeholder={t("eventLists.addNote", "Note (optional)")}
                    value={addNote} onChange={(e) => setAddNote(e.target.value)} />
                <button className={css.btnAccent} onClick={handleAdd} disabled={!addEventId}>
                    {t("eventLists.addEvent", "Add event")}
                </button>
            </div>

            {/* Bulk add events (comma-separated IDs) */}
            <div className={css.actionRow}>
                <input className={css.inputBulkIds}
                    placeholder={t("eventLists.bulkAddPlaceholder", "Bulk add: 1, 2, 3, 4 (comma-separated IDs)")}
                    value={bulkAddIds} onChange={(e) => setBulkAddIds(e.target.value)} />
                <button className={css.btnAccent} onClick={handleBulkAdd} disabled={!bulkAddIds.trim() || bulkAdd.isPending}>
                    {bulkAdd.isPending
                        ? t("common.saving", "Saving…")
                        : t("eventLists.bulkAdd", "Bulk Add")}
                </button>
            </div>

            {/* Subscribe to all events in this list */}
            <div className={css.bulkActionsRow}>
                <button className={css.btn}
                    onClick={() => subscribeToList.mutate({ listId })}
                    disabled={subscribeToList.isPending}>
                    <i className="fa-solid fa-bell" />{" "}
                    {subscribeToList.isPending
                        ? t("common.saving", "Saving…")
                        : t("eventLists.subscribeAll", "Subscribe to all events in list")}
                </button>
            </div>
        </div>
    );
};

// ── Main Page ───────────────────────────────────────────────────────
const EventListsPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: myLists, isLoading } = useMyEventListsQuery();
    const [publicPage, setPublicPage] = useState(1);
    const { data: publicData } = usePublicEventListsQuery(publicPage, 20);

    const createList = useCreateEventListMutation();
    const updateList = useUpdateEventListMutation();
    const deleteList = useDeleteEventListMutation();
    const toggleFavorite = useToggleFavoriteMutation();

    const [showModal, setShowModal] = useState(false);
    const [editList, setEditList] = useState<EventList | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleCreate = (data: CreateEventListRequest) => {
        createList.mutate(data);
        setShowModal(false);
    };

    const handleUpdate = useCallback(
        (data: CreateEventListRequest) => {
            if (!editList) return;
            updateList.mutate({ id: editList.id, req: data });
            setEditList(null);
        },
        [editList, updateList],
    );

    const lists = myLists ?? [];
    const publicLists = publicData?.items ?? [];

    return (
        <div className={css.page}>
            {/* Header */}
            <div className={css.pageHeader}>
                <h1 className={css.pageTitle}>{t("eventLists.title", "My Event Lists")}</h1>
                <button className={css.btnAccent} onClick={() => setShowModal(true)}>
                    + {t("eventLists.createNew", "Create new list")}
                </button>
            </div>

            {/* My lists grid */}
            {isLoading ? (
                <p>{t("common.loading", "Loading…")}</p>
            ) : lists.length === 0 ? (
                <p className={css.emptyText}>{t("eventLists.empty", "You have no event lists yet.")}</p>
            ) : (
                <div className={css.grid}>
                    {lists.map((list) => (
                        <div key={list.id} className={css.card} style={{
                            borderColor: expandedId === list.id ? "var(--accent, #5865F2)" : undefined,
                        }}>
                            {/* Card header */}
                            <div className={css.cardHeader}
                                onClick={() => setExpandedId(expandedId === list.id ? null : list.id)}>
                                <i className={`fa-solid fa-${list.iconKey || "list"}`}
                                    style={{ fontSize: 20, color: list.color || "#5865F2" }} />
                                {list.color && (
                                    <span className={css.colorDot}
                                        style={{ backgroundColor: list.color }} />
                                )}
                                <span className={css.listName}>{list.name}</span>
                            </div>
                            {/* Badges + info */}
                            <div className={css.badgeRow}>
                                <span className={css.badge} style={{ backgroundColor: typeBgColor(list.type) }}>{typeLabel(list.type)}</span>
                                <span className={css.badge} style={{ backgroundColor: visBgColor(list.visibility) }}>{visLabel(list.visibility)}</span>
                                <span className={css.itemCount}>
                                    {list.itemCount ?? list.items?.length ?? 0} {t("eventLists.items", "items")}
                                </span>
                            </div>
                            {/* Pin + actions */}
                            <div className={css.cardActions}>
                                <button className={list.isPinned ? css.btnAccent : css.btn}
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate(list.id); }}
                                    title={t("eventLists.pinToggle", "Toggle pin")}>
                                    {list.isPinned ? <i className="fa-solid fa-thumbtack" /> : <i className="fa-solid fa-location-dot" />}
                                </button>
                                <button className={css.btn} onClick={(e) => { e.stopPropagation(); setEditList(list); }}
                                    title={t("eventLists.edit", "Edit")}>
                                    <i className="fa-solid fa-pen-to-square" />
                                </button>
                                <button className={css.btn} onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(t("eventLists.confirmDelete", "Delete this list?")))
                                        deleteList.mutate(list.id);
                                }} title={t("eventLists.delete", "Delete")}>
                                    <i className="fa-solid fa-trash" />
                                </button>
                            </div>
                            {/* Expanded detail */}
                            {expandedId === list.id && (
                                <ListDetail listId={list.id} allLists={lists} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Public lists section */}
            <h2 className={css.publicTitle}>{t("eventLists.publicTitle", "Public Lists")}</h2>
            {publicLists.length === 0 ? (
                <p className={css.emptyText}>{t("eventLists.noPublic", "No public lists available.")}</p>
            ) : (
                <>
                    <div className={css.grid}>
                        {publicLists.map((list) => (
                            <div key={list.id} className={css.card}>
                                <div className={css.cardHeader}>
                                    <i className={`fa-solid fa-${list.iconKey || "list"}`}
                                        style={{ fontSize: 18, color: list.color || "#5865F2" }} />
                                    <span className={css.publicCardName}>{list.name}</span>
                                </div>
                                <div className={css.publicBadgeRow}>
                                    <span className={css.badge} style={{ backgroundColor: typeBgColor(list.type) }}>{typeLabel(list.type)}</span>
                                    <span className={css.itemCount}>
                                        {list.itemCount ?? 0} {t("eventLists.items", "items")}
                                    </span>
                                </div>
                                {list.description && (
                                    <p className={css.publicDescription}>{list.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Pagination */}
                    {publicData && publicData.totalCount > 20 && (
                        <div className={css.paginationRow}>
                            <button className={css.btn} disabled={publicPage <= 1}
                                onClick={() => setPublicPage((p) => p - 1)}>
                                ← {t("common.prev", "Prev")}
                            </button>
                            <span className={css.paginationText}>
                                {t("eventLists.page", "Page")} {publicPage} / {Math.ceil(publicData.totalCount / 20)}
                            </span>
                            <button className={css.btn} disabled={publicPage >= Math.ceil(publicData.totalCount / 20)}
                                onClick={() => setPublicPage((p) => p + 1)}>
                                {t("common.next", "Next")} →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create modal */}
            {showModal && (
                <ListModal
                    title={t("eventLists.createTitle", "Create Event List")}
                    onSave={handleCreate}
                    onClose={() => setShowModal(false)}
                />
            )}

            {/* Edit modal */}
            {editList && (
                <ListModal
                    title={t("eventLists.editTitle", "Edit Event List")}
                    initial={{
                        name: editList.name,
                        description: editList.description,
                        type: editList.type,
                        visibility: editList.visibility,
                        iconKey: editList.iconKey,
                        color: editList.color,
                    }}
                    onSave={handleUpdate}
                    onClose={() => setEditList(null)}
                />
            )}
        </div>
    );
};

export default EventListsPage;
