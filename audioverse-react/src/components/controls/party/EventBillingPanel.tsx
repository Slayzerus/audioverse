// EventBillingPanel.tsx — Expenses, payments, and settlement panel for PartyPage
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useExpensesQuery,
    useCreateExpenseMutation,
    useDeleteExpenseMutation,
    useSplitExpenseEquallyMutation,
    usePaymentsQuery,
    useCreatePaymentMutation,
    useDeletePaymentMutation,
    useConfirmPaymentMutation,
    useSettlementQuery,
} from "../../../scripts/api/apiEventBilling";
import type { EventExpense, EventPayment } from "../../../models/modelsKaraoke";
import { ExpenseCategory, SplitMethod, PaymentMethod, PaymentStatus } from "../../../models/modelsKaraoke";

interface Props {
    eventId: number;
}

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
};

type BillingTab = "expenses" | "payments" | "settlement";

const EventBillingPanel: React.FC<Props> = ({ eventId }) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<BillingTab>("expenses");
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<EventExpense>>({ category: ExpenseCategory.Custom, splitMethod: SplitMethod.Equal });
    const [newPayment, setNewPayment] = useState<Partial<EventPayment>>({ method: PaymentMethod.Cash, status: PaymentStatus.Pending });

    const expensesQ = useExpensesQuery(eventId);
    const paymentsQ = usePaymentsQuery(eventId);
    const settlementQ = useSettlementQuery(eventId);
    const createExpense = useCreateExpenseMutation();
    const deleteExpense = useDeleteExpenseMutation();
    const splitExpense = useSplitExpenseEquallyMutation();
    const createPayment = useCreatePaymentMutation();
    const deletePayment = useDeletePaymentMutation();
    const confirmPayment = useConfirmPaymentMutation();

    const handleAddExpense = async () => {
        if (!newExpense.title?.trim()) return;
        await createExpense.mutateAsync({ eventId, expense: newExpense });
        setNewExpense({ category: ExpenseCategory.Custom, splitMethod: SplitMethod.Equal });
        setShowAddExpense(false);
    };

    const handleAddPayment = async () => {
        if (!newPayment.amount) return;
        await createPayment.mutateAsync({ eventId, payment: newPayment });
        setNewPayment({ method: PaymentMethod.Cash, status: PaymentStatus.Pending });
        setShowAddPayment(false);
    };

    return (
        <div>
            <div className="btn-group btn-group-sm mb-3">
                <button className={`btn ${tab === "expenses" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setTab("expenses")}>
                    <i className="fa fa-receipt me-1" />{t("billing.expenses", "Expenses")}
                </button>
                <button className={`btn ${tab === "payments" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setTab("payments")}>
                    <i className="fa fa-credit-card me-1" />{t("billing.payments", "Payments")}
                </button>
                <button className={`btn ${tab === "settlement" ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setTab("settlement")}>
                    <i className="fa fa-balance-scale me-1" />{t("billing.settlement", "Settlement")}
                </button>
            </div>

            {/* ── Expenses Tab ── */}
            {tab === "expenses" && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">{t("billing.expenseList", "Expenses")}</h6>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddExpense(s => !s)}>
                            <i className="fa fa-plus me-1" />{t("common.add", "Add")}
                        </button>
                    </div>

                    {showAddExpense && (
                        <div style={cardStyle}>
                            <div className="row g-2">
                                <div className="col-md-4">
                                    <input className="form-control form-control-sm" placeholder={t("billing.expenseTitle", "Title")}
                                        value={newExpense.title ?? ""} onChange={e => setNewExpense(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="col-md-3">
                                    <input className="form-control form-control-sm" type="number" step="0.01" placeholder={t("billing.amount", "Amount")}
                                        value={newExpense.amount ?? ""} onChange={e => setNewExpense(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select form-select-sm" value={newExpense.category ?? ExpenseCategory.Custom}
                                        onChange={e => setNewExpense(p => ({ ...p, category: Number(e.target.value) as ExpenseCategory }))}>
                                        <option value={ExpenseCategory.Food}>{t("billing.catFood", "Food")}</option>
                                        <option value={ExpenseCategory.Drink}>{t("billing.catDrinks", "Drinks")}</option>
                                        <option value={ExpenseCategory.Transport}>{t("billing.catTransport", "Transport")}</option>
                                        <option value={ExpenseCategory.Rental}>{t("billing.catAccommodation", "Accommodation")}</option>
                                        <option value={ExpenseCategory.Custom}>{t("billing.catOther", "Other")}</option>
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <button className="btn btn-success btn-sm w-100" onClick={handleAddExpense} disabled={createExpense.isPending}>
                                        {t("common.save", "Save")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {expensesQ.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
                    <div>
                        {(expensesQ.data ?? []).map(exp => (
                            <div key={exp.id} style={cardStyle} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{exp.title}</strong>
                                    <span className="badge bg-secondary ms-2">{exp.category}</span>
                                    <div className="text-muted small">{exp.description}</div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-bold" style={{ fontSize: 16 }}>{(exp.amount ?? 0).toFixed(2)} PLN</span>
                                    <button className="btn btn-outline-info btn-sm" title={t("billing.splitEqually", "Split equally")}
                                        onClick={() => splitExpense.mutate({ eventId, expenseId: exp.id })}>
                                        <i className="fa fa-divide" />
                                    </button>
                                    <button className="btn btn-outline-danger btn-sm" onClick={() => deleteExpense.mutate({ eventId, expenseId: exp.id })}>
                                        <i className="fa fa-trash" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!expensesQ.isLoading && (expensesQ.data ?? []).length === 0 && (
                            <p className="text-muted text-center py-3">{t("billing.noExpenses", "No expenses yet.")}</p>
                        )}
                    </div>
                </>
            )}

            {/* ── Payments Tab ── */}
            {tab === "payments" && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">{t("billing.paymentList", "Payments")}</h6>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddPayment(s => !s)}>
                            <i className="fa fa-plus me-1" />{t("common.add", "Add")}
                        </button>
                    </div>

                    {showAddPayment && (
                        <div style={cardStyle}>
                            <div className="row g-2">
                                <div className="col-md-3">
                                    <input className="form-control form-control-sm" type="number" step="0.01" placeholder={t("billing.amount", "Amount")}
                                        value={newPayment.amount ?? ""} onChange={e => setNewPayment(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select form-select-sm" value={newPayment.method ?? PaymentMethod.Cash}
                                        onChange={e => setNewPayment(p => ({ ...p, method: Number(e.target.value) as PaymentMethod }))}>
                                        <option value={PaymentMethod.Cash}>{t("billing.methodCash", "Cash")}</option>
                                        <option value={PaymentMethod.BankTransfer}>{t("billing.methodTransfer", "Transfer")}</option>
                                        <option value={PaymentMethod.Blik}>{t("billing.methodBlik", "BLIK")}</option>
                                        <option value={PaymentMethod.Card}>{t("billing.methodCard", "Card")}</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <input className="form-control form-control-sm" placeholder={t("billing.note", "Note")}
                                        value={newPayment.note ?? ""} onChange={e => setNewPayment(p => ({ ...p, note: e.target.value }))} />
                                </div>
                                <div className="col-md-2">
                                    <button className="btn btn-success btn-sm w-100" onClick={handleAddPayment} disabled={createPayment.isPending}>
                                        {t("common.save", "Save")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentsQ.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
                    <div>
                        {(paymentsQ.data ?? []).map(pay => (
                            <div key={pay.id} style={cardStyle} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{(pay.amount ?? 0).toFixed(2)} PLN</strong>
                                    <span className="badge bg-info ms-2">{pay.method}</span>
                                    <span className={`badge ms-1 ${pay.status === PaymentStatus.Confirmed ? "bg-success" : "bg-warning"}`}>{PaymentStatus[pay.status]}</span>
                                    {pay.note && <div className="text-muted small">{pay.note}</div>}
                                    <div className="text-muted" style={{ fontSize: 11 }}>{pay.paidAt ? new Date(pay.paidAt).toLocaleString() : ""}</div>
                                </div>
                                <div className="d-flex gap-1">
                                    {pay.status !== PaymentStatus.Confirmed && (
                                        <button className="btn btn-outline-success btn-sm" title={t("billing.confirm", "Confirm")}
                                            onClick={() => confirmPayment.mutate({ eventId, paymentId: pay.id })}>
                                            <i className="fa fa-check" />
                                        </button>
                                    )}
                                    <button className="btn btn-outline-danger btn-sm" onClick={() => deletePayment.mutate({ eventId, paymentId: pay.id })}>
                                        <i className="fa fa-trash" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!paymentsQ.isLoading && (paymentsQ.data ?? []).length === 0 && (
                            <p className="text-muted text-center py-3">{t("billing.noPayments", "No payments yet.")}</p>
                        )}
                    </div>
                </>
            )}

            {/* ── Settlement Tab ── */}
            {tab === "settlement" && (
                <>
                    <h6>{t("billing.settlementTitle", "Settlement Summary")}</h6>
                    {settlementQ.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
                    {settlementQ.data && (
                        <pre style={{ ...cardStyle, fontSize: 13, whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(settlementQ.data, null, 2)}
                        </pre>
                    )}
                    {!settlementQ.isLoading && !settlementQ.data && (
                        <p className="text-muted text-center py-3">{t("billing.noSettlement", "No settlement data.")}</p>
                    )}
                </>
            )}
        </div>
    );
};

export default React.memo(EventBillingPanel);
