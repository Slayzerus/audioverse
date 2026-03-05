import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Container, Card, Spinner, Badge, ButtonGroup, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    FaCalendarAlt, FaArrowLeft, FaChevronLeft, FaChevronRight,
    FaList, FaTh, FaMapMarkerAlt, FaClock,
} from "react-icons/fa";
import { useFilteredEventsQuery } from "../../scripts/api/apiEvents";
import { useUser } from "../../contexts/UserContext";
import type { Event, EventStatus } from "../../models/modelsKaraoke";

/* ── helpers ── */
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const toDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const statusColor = (status?: EventStatus): string => {
    switch (status) {
        case 2: return "#66bb6a"; // ItsOn
        case 1: return "#42a5f5"; // Planned
        case 3: return "#bdbdbd"; // Finished
        case 4: return "#ef5350"; // Cancelled
        default: return "#ffa726";  // Created / Unknown
    }
};
const statusLabel = (status?: EventStatus): string => {
    switch (status) {
        case 2: return "Live";
        case 1: return "Planned";
        case 3: return "Finished";
        case 4: return "Cancelled";
        default: return "Draft";
    }
};

/* ── animation ── */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

/* ══════════════════════════════════════════════════════════════ */

type ViewMode = "month" | "list";

const EventCalendarPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useUser();

    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");

    const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
    const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);

    /* ── fetch events for current month range (with a buffer) ── */
    const from = useMemo(() => {
        const d = new Date(monthStart);
        d.setDate(d.getDate() - 7); // buffer for events starting before month
        return d.toISOString();
    }, [monthStart]);
    const to = useMemo(() => {
        const d = new Date(monthEnd);
        d.setDate(d.getDate() + 7);
        return d.toISOString();
    }, [monthEnd]);

    const { data: pagedEvents, isLoading } = useFilteredEventsQuery(
        { from, to, pageSize: 200, sortBy: "startTime" },
        { staleTime: 30_000 },
    );
    const events = pagedEvents?.items ?? [];

    /* ── index events by date ── */
    const eventsByDate = useMemo(() => {
        const map = new Map<string, Event[]>();
        events.forEach(ev => {
            if (!ev.startTime) return;
            const key = toDateKey(new Date(ev.startTime));
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        });
        return map;
    }, [events]);

    /* ── calendar grid cells ── */
    const calendarCells = useMemo(() => {
        const cells: { date: Date; inMonth: boolean }[] = [];
        const firstDay = monthStart.getDay(); // 0=Sun
        const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon-based offset
        // fill leading days from prev month
        for (let i = offset - 1; i >= 0; i--) {
            const d = new Date(monthStart);
            d.setDate(d.getDate() - i - 1);
            cells.push({ date: d, inMonth: false });
        }
        // month days
        const daysInMonth = monthEnd.getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), d), inMonth: true });
        }
        // trailing days to fill 6 rows
        const remaining = 42 - cells.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(monthEnd);
            d.setDate(d.getDate() + i);
            cells.push({ date: d, inMonth: false });
        }
        return cells;
    }, [monthStart, monthEnd, currentDate]);

    /* ── navigation ── */
    const prevMonth = useCallback(() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)), []);
    const nextMonth = useCallback(() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)), []);
    const goToday = useCallback(() => setCurrentDate(new Date()), []);

    const today = new Date();

    /* ── list view sorted events ── */
    const sortedEvents = useMemo(() =>
        [...events].sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")),
    [events]);

    /* ── upcoming events (next 7 days) ── */
    const upcomingEvents = useMemo(() => {
        const now = new Date();
        const weekLater = new Date(now);
        weekLater.setDate(weekLater.getDate() + 7);
        return sortedEvents.filter(ev => {
            if (!ev.startTime) return false;
            const d = new Date(ev.startTime);
            return d >= now && d <= weekLater;
        });
    }, [sortedEvents]);

    if (!isAuthenticated) {
        return (
            <Container className="py-5 text-center">
                <p style={{ color: "var(--text-secondary)" }}>{t("eventCalendar.loginRequired", "Please log in to see the event calendar.")}</p>
            </Container>
        );
    }

    return (
        <Container className="py-4" style={{ maxWidth: 1100 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/dashboard" className="btn btn-outline-secondary btn-sm" title={t("common.back", "Back")}>
                        <FaArrowLeft />
                    </Link>
                    <h2 style={{ color: "var(--text-primary)", margin: 0 }}>
                        <FaCalendarAlt className="me-2" style={{ color: "var(--nav-active)" }} />
                        {t("eventCalendar.title", "Event Calendar")}
                    </h2>
                    <div className="ms-auto" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <ButtonGroup size="sm">
                            <Button variant={viewMode === "month" ? "primary" : "outline-secondary"} onClick={() => setViewMode("month")} title={t("eventCalendar.monthView", "Month")}>
                                <FaTh />
                            </Button>
                            <Button variant={viewMode === "list" ? "primary" : "outline-secondary"} onClick={() => setViewMode("list")} title={t("eventCalendar.listView", "List")}>
                                <FaList />
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>
            </motion.div>

            {/* Month Navigation */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-3">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                    <Button variant="outline-secondary" size="sm" onClick={prevMonth} aria-label={t("eventCalendar.prevMonth", "Previous month")}>
                        <FaChevronLeft />
                    </Button>
                    <h4 style={{ color: "var(--text-primary)", margin: 0, minWidth: 200, textAlign: "center" }}>
                        {t(`eventCalendar.month.${currentDate.getMonth()}`, MONTHS[currentDate.getMonth()])} {currentDate.getFullYear()}
                    </h4>
                    <Button variant="outline-secondary" size="sm" onClick={nextMonth} aria-label={t("eventCalendar.nextMonth", "Next month")}>
                        <FaChevronRight />
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={goToday}>
                        {t("eventCalendar.today", "Today")}
                    </Button>
                </div>
            </motion.div>

            {isLoading && (
                <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
            )}

            {!isLoading && viewMode === "month" && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    {/* Upcoming alert */}
                    {upcomingEvents.length > 0 && (
                        <Card className="mb-3" style={{ background: "var(--bg-secondary)", border: "1px solid #42a5f540" }}>
                            <Card.Body style={{ padding: "10px 16px" }}>
                                <strong style={{ color: "#42a5f5", fontSize: 13 }}>
                                    <FaClock className="me-1" />
                                    {t("eventCalendar.upcoming", "Upcoming this week:")}
                                </strong>{" "}
                                <span style={{ color: "var(--text-primary)", fontSize: 13 }}>
                                    {upcomingEvents.map(ev => ev.title || ev.name).join(", ")}
                                </span>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Calendar Grid */}
                    <Card style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                        <Card.Body style={{ padding: 0 }}>
                            {/* Day headers */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-primary)" }}>
                                {DAYS_OF_WEEK.map(day => (
                                    <div key={day} style={{ padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                                        {t(`eventCalendar.day.${day}`, day)}
                                    </div>
                                ))}
                            </div>
                            {/* Date cells */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                                {calendarCells.map((cell, i) => {
                                    const key = toDateKey(cell.date);
                                    const dayEvents = eventsByDate.get(key) ?? [];
                                    const isToday = isSameDay(cell.date, today);
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                minHeight: 80,
                                                padding: "4px 6px",
                                                borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border-primary)" : undefined,
                                                borderBottom: i < 35 ? "1px solid var(--border-primary)" : undefined,
                                                background: isToday ? "rgba(66,165,245,0.08)" : undefined,
                                                opacity: cell.inMonth ? 1 : 0.35,
                                            }}
                                        >
                                            <div style={{
                                                fontSize: 12,
                                                fontWeight: isToday ? 700 : 400,
                                                color: isToday ? "#42a5f5" : "var(--text-secondary)",
                                                marginBottom: 2,
                                            }}>
                                                {cell.date.getDate()}
                                            </div>
                                            {dayEvents.slice(0, 3).map(ev => (
                                                <div
                                                    key={ev.id}
                                                    title={`${ev.title || ev.name} — ${statusLabel(ev.status)}`}
                                                    style={{
                                                        fontSize: 10,
                                                        padding: "1px 4px",
                                                        marginBottom: 2,
                                                        borderRadius: 3,
                                                        background: `${statusColor(ev.status)}22`,
                                                        borderLeft: `3px solid ${statusColor(ev.status)}`,
                                                        color: "var(--text-primary)",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {ev.title || ev.name || "Event"}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>+{dayEvents.length - 3} more</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            )}

            {!isLoading && viewMode === "list" && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    <Card style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                        <Card.Body style={{ padding: 0 }}>
                            {sortedEvents.length > 0 ? (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)", fontSize: 12 }}>
                                            <th style={{ padding: "10px 12px" }}>{t("eventCalendar.date", "Date")}</th>
                                            <th style={{ padding: "10px 12px" }}>{t("eventCalendar.event", "Event")}</th>
                                            <th style={{ padding: "10px 12px" }}>{t("eventCalendar.location", "Location")}</th>
                                            <th style={{ padding: "10px 12px", textAlign: "center" }}>{t("eventCalendar.status", "Status")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedEvents.map(ev => {
                                            const start = ev.startTime ? new Date(ev.startTime) : null;
                                            return (
                                                <tr key={ev.id} style={{ borderBottom: "1px solid var(--border-primary)", color: "var(--text-primary)", fontSize: 14 }}>
                                                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                                                        {start ? start.toLocaleDateString() : "—"}
                                                        {start && (
                                                            <span style={{ marginLeft: 6, fontSize: 12 }}>
                                                                {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "8px 12px", fontWeight: 500 }}>
                                                        <Link to={`/party/${ev.id}`} style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                                                            {ev.title || ev.name || "Event"}
                                                        </Link>
                                                    </td>
                                                    <td style={{ padding: "8px 12px", color: "var(--text-secondary)", fontSize: 13 }}>
                                                        {ev.locationName ? (
                                                            <><FaMapMarkerAlt style={{ marginRight: 4, fontSize: 11 }} />{ev.locationName}</>
                                                        ) : "—"}
                                                    </td>
                                                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                        <Badge style={{ background: statusColor(ev.status), fontSize: 11 }}>
                                                            {t(`eventCalendar.status.${ev.status}`, statusLabel(ev.status))}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-4" style={{ color: "var(--text-secondary)" }}>
                                    {t("eventCalendar.noEvents", "No events in this month.")}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </motion.div>
            )}

            {/* Legend */}
            {!isLoading && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mt-3" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                    {[
                        { label: "Live", color: "#66bb6a" },
                        { label: "Planned", color: "#42a5f5" },
                        { label: "Draft", color: "#ffa726" },
                        { label: "Finished", color: "#bdbdbd" },
                        { label: "Cancelled", color: "#ef5350" },
                    ].map(item => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                            {t(`eventCalendar.legend.${item.label}`, item.label)}
                        </div>
                    ))}
                </motion.div>
            )}
        </Container>
    );
};

export default EventCalendarPage;
