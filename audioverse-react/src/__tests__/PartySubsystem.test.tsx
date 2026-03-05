/**
 * Party subsystem component tests.
 *
 * Covers: ParticipantsApprovalPanel, EventCommentsPanel, EventPollsPanel,
 *         EventDetailPage (tab rendering).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ── i18n mock ──
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback ?? key,
        i18n: { language: "en" },
    }),
    Trans: ({ children }: any) => children,
}));

// ── API mocks ──
vi.mock("../scripts/api/apiEventComments", () => ({
    useEventCommentsQuery: vi.fn(() => ({ data: { items: [] }, isLoading: false })),
    usePostEventCommentMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useDeleteEventCommentMutation: vi.fn(() => ({ mutate: vi.fn() })),
    useToggleCommentReactionMutation: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock("../scripts/api/apiEventPolls", () => ({
    usePollsQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useCreatePollMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useDeletePollMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    usePollResultsQuery: vi.fn(() => ({ data: null })),
    useSendPollEmailsMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("../scripts/api/apiKaraoke", () => ({
    usePartyQuery: vi.fn(() => ({
        data: { id: 1, name: "Test Event", status: 1 },
        isLoading: false,
        error: null,
    })),
}));

vi.mock("../scripts/api/apiEventPhotos", () => ({
    useEventPhotosQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useUploadEventPhotoMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useDeleteEventPhotoMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useTogglePhotoLikeMutation: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock("../scripts/api/apiEventBilling", () => ({
    useExpensesQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useCreateExpenseMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useDeleteExpenseMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useSplitExpenseEquallyMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    usePaymentsQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useCreatePaymentMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useDeletePaymentMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useConfirmPaymentMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useSettlementQuery: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("../scripts/api/apiEventSubscriptions", () => ({
    useSubscriptionCheckQuery: vi.fn(() => ({ data: false, isLoading: false })),
    useEventSubscriptionQuery: vi.fn(() => ({ data: null, isLoading: false })),
    useSubscribeToEventMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useUnsubscribeMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useEventSubscribersQuery: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("../scripts/api/apiEventLists", () => ({
    useMyEventListsQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useEventExistsInListQuery: vi.fn(() => ({ data: false })),
    useAddEventToListMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("../scripts/api/apiEvents", () => ({
    useDateProposalsQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useDateBestQuery: vi.fn(() => ({ data: [], isLoading: false })),
    useCreateDateProposalMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useDeleteDateProposalMutation: vi.fn(() => ({ mutate: vi.fn() })),
    useDateVoteMutation: vi.fn(() => ({ mutate: vi.fn() })),
    useDeleteDateVoteMutation: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock("../contexts/UserContext", () => ({
    useUser: vi.fn(() => ({ userId: 1, userName: "TestUser", isAuthenticated: true })),
}));

// ── Import components ──

import ParticipantsApprovalPanel from "../components/controls/party/ParticipantsApprovalPanel";
import EventCommentsPanel from "../components/controls/party/EventCommentsPanel";
import EventPollsPanel from "../components/controls/party/EventPollsPanel";
import DateProposalsPanel from "../components/controls/party/DateProposalsPanel";
import EventBillingPanel from "../components/controls/party/EventBillingPanel";

// ── Import mocked hooks (for dynamic overrides) ──
import { useEventCommentsQuery } from "../scripts/api/apiEventComments";
const mockUseEventCommentsQuery = vi.mocked(useEventCommentsQuery);

import { usePollsQuery } from "../scripts/api/apiEventPolls";
const mockUsePollsQuery = vi.mocked(usePollsQuery);

import { useDateProposalsQuery, useDateBestQuery } from "../scripts/api/apiEvents";
const mockUseDateProposalsQuery = vi.mocked(useDateProposalsQuery);
const mockUseDateBestQuery = vi.mocked(useDateBestQuery);

import { useExpensesQuery, usePaymentsQuery, useSettlementQuery } from "../scripts/api/apiEventBilling";
const mockUseExpensesQuery = vi.mocked(useExpensesQuery);
const mockUsePaymentsQuery = vi.mocked(usePaymentsQuery);
const mockUseSettlementQuery = vi.mocked(useSettlementQuery);

// ── Helpers ──

function createQueryWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    );
}

// ══════════════════════════════════════════════
// ParticipantsApprovalPanel
// ══════════════════════════════════════════════
describe("ParticipantsApprovalPanel", () => {
    it("shows joined participants", () => {
        render(
            <ParticipantsApprovalPanel
                participants={[{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]}
                waiting={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("shows empty state when no joined participants", () => {
        render(
            <ParticipantsApprovalPanel
                participants={[]}
                waiting={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        expect(screen.getByText("participantsPanel.noJoinedPeople")).toBeInTheDocument();
    });

    it("shows waiting entries with approve/reject buttons", () => {
        render(
            <ParticipantsApprovalPanel
                participants={[]}
                waiting={[{ id: 10, name: "Charlie" }]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        expect(screen.getByText("Charlie")).toBeInTheDocument();
        expect(screen.getByText("common.approved")).toBeInTheDocument();
        expect(screen.getByText("common.reject")).toBeInTheDocument();
    });

    it("shows waiting verification header", () => {
        render(
            <ParticipantsApprovalPanel
                participants={[]}
                waiting={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        expect(screen.getByText("participantsPanel.waitingVerification")).toBeInTheDocument();
    });

    it("shows empty state for waiting list", () => {
        render(
            <ParticipantsApprovalPanel
                participants={[]}
                waiting={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        expect(screen.getByText("participantsPanel.noWaitingEntries")).toBeInTheDocument();
    });

    it("calls onApprove when approve button clicked", () => {
        const onApprove = vi.fn();
        const entry = { id: 10, name: "Charlie" };
        render(
            <ParticipantsApprovalPanel
                participants={[]}
                waiting={[entry]}
                onApprove={onApprove}
                onReject={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByText("common.approved"));
        expect(onApprove).toHaveBeenCalledWith(entry);
    });

    it("calls onReject when reject button clicked", () => {
        const onReject = vi.fn();
        const entry = { id: 10, name: "Charlie" };
        render(
            <ParticipantsApprovalPanel
                participants={[]}
                waiting={[entry]}
                onApprove={vi.fn()}
                onReject={onReject}
            />,
        );

        fireEvent.click(screen.getByText("common.reject"));
        expect(onReject).toHaveBeenCalledWith(entry);
    });

    it("shows participant ID", () => {
        render(
            <ParticipantsApprovalPanel
                participants={[{ id: 42, name: "Dave" }]}
                waiting={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        expect(screen.getByText("#42")).toBeInTheDocument();
    });

    it("renders both sections", () => {
        render(
            <ParticipantsApprovalPanel
                participants={[]}
                waiting={[]}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        expect(screen.getByText("participantsPanel.joinedPeople")).toBeInTheDocument();
        expect(screen.getByText("participantsPanel.waitingVerification")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// EventCommentsPanel
// ══════════════════════════════════════════════
describe("EventCommentsPanel", () => {
    beforeEach(() => {
        mockUseEventCommentsQuery.mockReturnValue({
            data: { items: [] },
            isLoading: false,
        } as any);
    });

    it("renders comments panel title", () => {
        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        expect(screen.getByText(/Comments/)).toBeInTheDocument();
    });

    it("shows empty state when no comments", () => {
        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        expect(screen.getByText(/No comments yet/)).toBeInTheDocument();
    });

    it("renders comment input area", () => {
        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        expect(screen.getByPlaceholderText("Write a comment...")).toBeInTheDocument();
        expect(screen.getByText("Post")).toBeInTheDocument();
    });

    it("disables Post button when textarea is empty", () => {
        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        const btn = screen.getByText("Post");
        expect(btn).toBeDisabled();
    });

    it("enables Post button when text entered", () => {
        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        const textarea = screen.getByPlaceholderText("Write a comment...");
        fireEvent.change(textarea, { target: { value: "Hello!" } });

        const btn = screen.getByText("Post");
        expect(btn).not.toBeDisabled();
    });

    it("shows loading state", () => {
        mockUseEventCommentsQuery.mockReturnValue({ data: null, isLoading: true } as any);

        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders comments when data is provided", () => {
        mockUseEventCommentsQuery.mockReturnValue({
            data: {
                items: [
                    { id: 1, text: "Great event!", userId: 5, parentId: null, createdAt: "2025-01-01T12:00:00Z" },
                ],
            },
            isLoading: false,
        } as any);

        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        expect(screen.getByText("Great event!")).toBeInTheDocument();
        expect(screen.getByText("User #5")).toBeInTheDocument();
    });

    it("shows reaction buttons on comments", () => {
        mockUseEventCommentsQuery.mockReturnValue({
            data: {
                items: [
                    { id: 1, text: "Test comment", userId: 1, parentId: null },
                ],
            },
            isLoading: false,
        } as any);

        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        expect(screen.getByText("👍")).toBeInTheDocument();
        expect(screen.getByText("❤️")).toBeInTheDocument();
        expect(screen.getByText("Reply")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("shows anonymous for comments without userId", () => {
        mockUseEventCommentsQuery.mockReturnValue({
            data: {
                items: [
                    { id: 1, text: "Anonymous comment", userId: null, parentId: null },
                ],
            },
            isLoading: false,
        } as any);

        const Wrapper = createQueryWrapper();
        render(
            <Wrapper>
                <EventCommentsPanel eventId={1} />
            </Wrapper>,
        );

        expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// EventPollsPanel
// ══════════════════════════════════════════════
describe("EventPollsPanel", () => {
    beforeEach(() => {
        mockUsePollsQuery.mockReturnValue({ data: [], isLoading: false } as any);
    });

    it("renders polls heading", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Polls")).toBeInTheDocument();
    });

    it("shows empty state when no polls", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText(/No polls yet/)).toBeInTheDocument();
    });

    it("shows Add button when isOrganizer", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} isOrganizer /></Wrapper>);
        expect(screen.getByText("Add")).toBeInTheDocument();
    });

    it("hides Add button when not organizer", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.queryByText("Add")).not.toBeInTheDocument();
    });

    it("shows create poll form when Add clicked", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} isOrganizer /></Wrapper>);
        fireEvent.click(screen.getByText("Add"));
        expect(screen.getByText("Create Poll")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Title")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
        expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("shows poll type options in create form", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} isOrganizer /></Wrapper>);
        fireEvent.click(screen.getByText("Add"));
        expect(screen.getByText("Single choice")).toBeInTheDocument();
        expect(screen.getByText("Multiple choice")).toBeInTheDocument();
        expect(screen.getByText("Quantity")).toBeInTheDocument();
    });

    it("shows track costs checkbox in create form", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} isOrganizer /></Wrapper>);
        fireEvent.click(screen.getByText("Add"));
        expect(screen.getByText("Track costs per option")).toBeInTheDocument();
    });

    it("shows loading state", () => {
        mockUsePollsQuery.mockReturnValue({ data: null, isLoading: true } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders poll title from data", () => {
        mockUsePollsQuery.mockReturnValue({
            data: [{ id: 1, title: "Lunch Choice", isActive: true, type: 0, trackCosts: false, options: [] }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Lunch Choice")).toBeInTheDocument();
    });

    it("shows Active badge for active poll", () => {
        mockUsePollsQuery.mockReturnValue({
            data: [{ id: 1, title: "Poll 1", isActive: true, type: 0, trackCosts: false, options: [] }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("shows Closed badge for inactive poll", () => {
        mockUsePollsQuery.mockReturnValue({
            data: [{ id: 1, title: "Old Poll", isActive: false, type: 0, trackCosts: false, options: [] }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Closed")).toBeInTheDocument();
    });

    it("shows costs tracked badge", () => {
        mockUsePollsQuery.mockReturnValue({
            data: [{ id: 1, title: "Cost Poll", isActive: true, type: 0, trackCosts: true, options: [] }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventPollsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("💰")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// DateProposalsPanel
// ══════════════════════════════════════════════
describe("DateProposalsPanel", () => {
    beforeEach(() => {
        mockUseDateProposalsQuery.mockReturnValue({ data: [], isLoading: false } as any);
        mockUseDateBestQuery.mockReturnValue({ data: [], isLoading: false } as any);
    });

    it("renders heading", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Date Proposals")).toBeInTheDocument();
    });

    it("shows empty state when no proposals", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText(/No date proposals yet/)).toBeInTheDocument();
    });

    it("shows Add and Show Results buttons", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Add")).toBeInTheDocument();
        expect(screen.getByText("Show Results")).toBeInTheDocument();
    });

    it("shows create form when Add clicked", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        fireEvent.click(screen.getByText("Add"));
        expect(screen.getByText("Start")).toBeInTheDocument();
        expect(screen.getByText("End")).toBeInTheDocument();
        expect(screen.getByText("Note")).toBeInTheDocument();
        expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("toggles Show/Hide Results button text", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        const btn = screen.getByText("Show Results");
        fireEvent.click(btn);
        expect(screen.getByText("Hide Results")).toBeInTheDocument();
    });

    it("shows vote buttons on proposals", () => {
        mockUseDateProposalsQuery.mockReturnValue({
            data: [{ id: 1, proposedStart: "2025-06-01T18:00:00Z", votes: [] }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("✅")).toBeInTheDocument();
        expect(screen.getByText("🤔")).toBeInTheDocument();
        expect(screen.getByText("❌")).toBeInTheDocument();
    });

    it("shows vote count on proposals", () => {
        mockUseDateProposalsQuery.mockReturnValue({
            data: [{ id: 1, proposedStart: "2025-06-01T18:00:00Z", votes: [{ userId: 1 }, { userId: 2 }] }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText(/2 vote/)).toBeInTheDocument();
    });

    it("shows proposal note", () => {
        mockUseDateProposalsQuery.mockReturnValue({
            data: [{ id: 1, proposedStart: "2025-06-01T18:00:00Z", note: "Friday party", votes: [] }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><DateProposalsPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Friday party")).toBeInTheDocument();
    });
});

// ══════════════════════════════════════════════
// EventBillingPanel
// ══════════════════════════════════════════════
describe("EventBillingPanel", () => {
    beforeEach(() => {
        mockUseExpensesQuery.mockReturnValue({ data: [], isLoading: false } as any);
        mockUsePaymentsQuery.mockReturnValue({ data: [], isLoading: false } as any);
        mockUseSettlementQuery.mockReturnValue({ data: [], isLoading: false } as any);
    });

    it("renders three tab buttons", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventBillingPanel eventId={1} /></Wrapper>);
        // "Expenses" appears both as tab button and as heading, so use getAllByText
        expect(screen.getAllByText("Expenses").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Payments")).toBeInTheDocument();
        expect(screen.getByText("Settlement")).toBeInTheDocument();
    });

    it("defaults to expenses tab", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventBillingPanel eventId={1} /></Wrapper>);
        // Expenses tab should have an Add button visible
        expect(screen.getByText("Add")).toBeInTheDocument();
    });

    it("switches to payments tab", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventBillingPanel eventId={1} /></Wrapper>);
        fireEvent.click(screen.getByText("Payments"));
        // Payment tab should be active
        expect(screen.getByText("Add")).toBeInTheDocument();
    });

    it("switches to settlement tab", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventBillingPanel eventId={1} /></Wrapper>);
        fireEvent.click(screen.getByText("Settlement"));
        // Settlement view should not have Add button
        expect(screen.queryByText("Add")).not.toBeInTheDocument();
    });

    it("shows expenses when data present", () => {
        mockUseExpensesQuery.mockReturnValue({
            data: [{ id: 1, title: "Pizza", amount: 45.00, category: 0, splitMethod: 0 }],
            isLoading: false,
        } as any);
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventBillingPanel eventId={1} /></Wrapper>);
        expect(screen.getByText("Pizza")).toBeInTheDocument();
        expect(screen.getByText(/45/)).toBeInTheDocument();
    });

    it("shows add expense form when Add is clicked", () => {
        const Wrapper = createQueryWrapper();
        render(<Wrapper><EventBillingPanel eventId={1} /></Wrapper>);
        fireEvent.click(screen.getByText("Add"));
        expect(screen.getByPlaceholderText("Title")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
    });
});
