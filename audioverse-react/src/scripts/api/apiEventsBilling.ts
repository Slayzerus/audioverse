// apiEventsBilling.ts — Billing fetchers
import { apiClient, apiPath } from "./audioverseApiClient";
import { logger } from "../../utils/logger";
const log = logger.scoped('apiEventsBilling');
import { EVENTS_BASE } from "./apiEventsKeys";

// === Low-level fetchers ===

/** @internal GET /api/events/{eventId}/billing/expenses — List expenses */
export const fetchEventBillingExpenses = async (eventId: number): Promise<unknown[]> => {
    const { data } = await apiClient.get<unknown[]>(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses`));
    return data;
};

/** @internal POST /api/events/{eventId}/billing/expenses — Add expense */
export const postEventBillingExpense = async (eventId: number, expense: unknown): Promise<unknown> => {
    const { data } = await apiClient.post<unknown>(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses`), expense);
    return data;
};

/** @internal * @deprecated POST /api/events/{eventId}/billing/split not in swagger. */
export const postEventBillingSplit = async (_eventId: number, _splitData: unknown): Promise<unknown> => {
    log.warn('postEventBillingSplit: /billing/split endpoint not in swagger.');
    return null;
};

/** @internal GET /api/events/{eventId}/billing/settlement — Get settlement */
export const fetchEventBillingSettlement = async (eventId: number): Promise<unknown> => {
    const { data } = await apiClient.get<unknown>(apiPath(EVENTS_BASE, `/${eventId}/billing/settlement`));
    return data;
};
