// apiEventBilling.ts — Event billing: expenses, payments, settlement
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { EventExpense, EventPayment } from "../../models/modelsKaraoke";

// === Base path ===
const EVENTS_BASE = "/api/events";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const BILLING_QK = {
    expenses: (eventId: number) => ["billing", eventId, "expenses"] as const,
    expense: (eventId: number, expenseId: number) => ["billing", eventId, "expense", expenseId] as const,
    payments: (eventId: number) => ["billing", eventId, "payments"] as const,
    settlement: (eventId: number) => ["billing", eventId, "settlement"] as const,
};

// ── Expenses ──────────────────────────────────────────────────

/** @internal GET /api/events/{eventId}/billing/expenses — List all expenses */
export const fetchExpenses = async (eventId: number): Promise<EventExpense[]> => {
    const { data } = await apiClient.get<EventExpense[]>(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses`));
    return data ?? [];
};

/** @internal POST /api/events/{eventId}/billing/expenses — Add expense */
export const postCreateExpense = async (eventId: number, expense: Partial<EventExpense>): Promise<EventExpense> => {
    const { data } = await apiClient.post<EventExpense>(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses`), expense);
    return data;
};

/** @internal GET /api/events/{eventId}/billing/expenses/{expenseId} — Get expense with shares */
export const fetchExpenseById = async (eventId: number, expenseId: number): Promise<EventExpense> => {
    const { data } = await apiClient.get<EventExpense>(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses/${expenseId}`));
    return data;
};

/** @internal PUT /api/events/{eventId}/billing/expenses/{expenseId} — Update expense */
export const putUpdateExpense = async (eventId: number, expenseId: number, expense: Partial<EventExpense>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses/${expenseId}`), expense);
};

/** @internal DELETE /api/events/{eventId}/billing/expenses/{expenseId} — Delete expense */
export const deleteExpense = async (eventId: number, expenseId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses/${expenseId}`));
};

/** @internal POST /api/events/{eventId}/billing/expenses/{expenseId}/split-equally — Split equally */
export const postSplitExpenseEqually = async (eventId: number, expenseId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/billing/expenses/${expenseId}/split-equally`));
};

/** @internal POST /api/events/{eventId}/billing/import-from-poll/{pollId} — Import from poll results */
export const postImportExpensesFromPoll = async (eventId: number, pollId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/billing/import-from-poll/${pollId}`));
};

// ── Payments ──────────────────────────────────────────────────

/** @internal GET /api/events/{eventId}/billing/payments — List payments */
export const fetchPayments = async (eventId: number): Promise<EventPayment[]> => {
    const { data } = await apiClient.get<EventPayment[]>(apiPath(EVENTS_BASE, `/${eventId}/billing/payments`));
    return data ?? [];
};

/** @internal POST /api/events/{eventId}/billing/payments — Record payment */
export const postCreatePayment = async (eventId: number, payment: Partial<EventPayment>): Promise<EventPayment> => {
    const { data } = await apiClient.post<EventPayment>(apiPath(EVENTS_BASE, `/${eventId}/billing/payments`), payment);
    return data;
};

/** @internal PUT /api/events/{eventId}/billing/payments/{paymentId} — Update payment */
export const putUpdatePayment = async (eventId: number, paymentId: number, payment: Partial<EventPayment>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/billing/payments/${paymentId}`), payment);
};

/** @internal DELETE /api/events/{eventId}/billing/payments/{paymentId} — Delete payment */
export const deletePayment = async (eventId: number, paymentId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/billing/payments/${paymentId}`));
};

/** @internal POST /api/events/{eventId}/billing/payments/{paymentId}/confirm — Confirm payment */
export const postConfirmPayment = async (eventId: number, paymentId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/billing/payments/${paymentId}/confirm`));
};

// ── Settlement ────────────────────────────────────────────────

/** @internal GET /api/events/{eventId}/billing/settlement — Consolidated settlement */
export const fetchSettlement = async (eventId: number): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(EVENTS_BASE, `/${eventId}/billing/settlement`));
    return data;
};

// === React Query Hooks ===

export const useExpensesQuery = (eventId: number, options?: Partial<UseQueryOptions<EventExpense[], unknown, EventExpense[], QueryKey>>) =>
    useQuery({ queryKey: BILLING_QK.expenses(eventId), queryFn: () => fetchExpenses(eventId), enabled: Number.isFinite(eventId), ...options });

export const useExpenseQuery = (eventId: number, expenseId: number) =>
    useQuery({ queryKey: BILLING_QK.expense(eventId, expenseId), queryFn: () => fetchExpenseById(eventId, expenseId), enabled: Number.isFinite(eventId) && Number.isFinite(expenseId) });

export const useCreateExpenseMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventExpense, unknown, { eventId: number; expense: Partial<EventExpense> }>({
        mutationFn: ({ eventId, expense }) => postCreateExpense(eventId, expense),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.expenses(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useUpdateExpenseMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; expenseId: number; expense: Partial<EventExpense> }>({
        mutationFn: ({ eventId, expenseId, expense }) => putUpdateExpense(eventId, expenseId, expense),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.expenses(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.expense(v.eventId, v.expenseId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useDeleteExpenseMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; expenseId: number }>({
        mutationFn: ({ eventId, expenseId }) => deleteExpense(eventId, expenseId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.expenses(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useSplitExpenseEquallyMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; expenseId: number }>({
        mutationFn: ({ eventId, expenseId }) => postSplitExpenseEqually(eventId, expenseId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.expenses(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useImportExpensesFromPollMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; pollId: number }>({
        mutationFn: ({ eventId, pollId }) => postImportExpensesFromPoll(eventId, pollId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.expenses(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const usePaymentsQuery = (eventId: number, options?: Partial<UseQueryOptions<EventPayment[], unknown, EventPayment[], QueryKey>>) =>
    useQuery({ queryKey: BILLING_QK.payments(eventId), queryFn: () => fetchPayments(eventId), enabled: Number.isFinite(eventId), ...options });

export const useCreatePaymentMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventPayment, unknown, { eventId: number; payment: Partial<EventPayment> }>({
        mutationFn: ({ eventId, payment }) => postCreatePayment(eventId, payment),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.payments(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useUpdatePaymentMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; paymentId: number; payment: Partial<EventPayment> }>({
        mutationFn: ({ eventId, paymentId, payment }) => putUpdatePayment(eventId, paymentId, payment),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.payments(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useDeletePaymentMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; paymentId: number }>({
        mutationFn: ({ eventId, paymentId }) => deletePayment(eventId, paymentId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.payments(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useConfirmPaymentMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; paymentId: number }>({
        mutationFn: ({ eventId, paymentId }) => postConfirmPayment(eventId, paymentId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BILLING_QK.payments(v.eventId) }); qc.invalidateQueries({ queryKey: BILLING_QK.settlement(v.eventId) }); },
    });
};

export const useSettlementQuery = (eventId: number) =>
    useQuery({ queryKey: BILLING_QK.settlement(eventId), queryFn: () => fetchSettlement(eventId), enabled: Number.isFinite(eventId) });

export default {
    fetchExpenses,
    postCreateExpense,
    fetchExpenseById,
    putUpdateExpense,
    deleteExpense,
    postSplitExpenseEqually,
    postImportExpensesFromPoll,
    fetchPayments,
    postCreatePayment,
    putUpdatePayment,
    deletePayment,
    postConfirmPayment,
    fetchSettlement,
};
