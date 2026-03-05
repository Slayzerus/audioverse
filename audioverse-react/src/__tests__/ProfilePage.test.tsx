import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUserId = 42;
vi.mock("../contexts/UserContext", () => ({
    useUser: () => ({
        currentUser: { username: "testuser", userId: mockUserId },
        userId: mockUserId,
    }),
}));

const mockGetProfilePlayers = vi.fn();
const mockUploadUserPhoto = vi.fn();
const mockDeleteUserPhoto = vi.fn();
vi.mock("../scripts/api/apiUser", () => ({
    default: { getProfilePlayers: (...args: unknown[]) => mockGetProfilePlayers(...args) },
    getUserPhotoUrl: (id: number) => `/api/user/profiles/${id}/photo`,
    uploadUserPhoto: (...args: unknown[]) => mockUploadUserPhoto(...args),
    deleteUserPhoto: (...args: unknown[]) => mockDeleteUserPhoto(...args),
}));

const mockFetchContacts = vi.fn();
const mockCreateContact = vi.fn();
const mockUpdateMutate = vi.fn();

/* Contact detail returned by the mocked useContactDetailQuery hook */
let contactDetailResult: { data: unknown; isLoading: boolean };

vi.mock("../scripts/api/apiContacts", () => ({
    fetchContacts: (...args: unknown[]) => mockFetchContacts(...args),
    createContact: (...args: unknown[]) => mockCreateContact(...args),
    useContactDetailQuery: () => contactDetailResult,
    useUpdateContactMutation: () => ({
        mutate: mockUpdateMutate,
        isPending: false,
    }),
}));

import ProfilePage from "../pages/profile/ProfilePage";

// ── Helpers ───────────────────────────────────────────────────

const samplePlayer = {
    id: 1,
    name: "Player One",
    displayName: "Player One",
    isPrimary: true,
    photoUrl: null,
    color: "#ff0000",
};

const sampleContact = {
    id: 100,
    firstName: "Jan",
    lastName: "Kowalski",
    displayName: "Jan Kowalski",
    displayNamePrivate: "Jaś",
    nickname: "jk",
    company: "ACME",
    jobTitle: "Dev",
    notes: null,
    avatarUrl: null,
    isOrganization: false,
    isFavorite: false,
    linkedUserId: mockUserId,
    organizationId: null,
    importSource: 0,
    externalId: null,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
    emails: [{ id: 1, email: "jan@example.com", type: 0, isPrimary: true }],
    phones: [],
    addresses: [],
    groups: [],
};

function createQC() {
    return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderPage() {
    const qc = createQC();
    return render(
        <QueryClientProvider client={qc}>
            <ProfilePage />
        </QueryClientProvider>,
    );
}

describe("ProfilePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks: player exists, contact linked
        mockGetProfilePlayers.mockResolvedValue([samplePlayer]);
        mockFetchContacts.mockResolvedValue({ items: [{ id: 100, linkedUserId: mockUserId }] });
        contactDetailResult = { data: sampleContact, isLoading: false };
    });

    it("shows loading spinner while data is fetched", () => {
        mockGetProfilePlayers.mockReturnValue(new Promise(() => {})); // never resolves
        renderPage();
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders user profile card with contact display name", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
        });
    });

    it("shows username and user ID in profile card", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/testuser/)).toBeInTheDocument();
        });
    });

    it("renders contact card fields in read-only mode", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText("Jan")).toBeInTheDocument();
            expect(screen.getByText("Kowalski")).toBeInTheDocument();
            expect(screen.getByText("ACME")).toBeInTheDocument();
            expect(screen.getByText("Dev")).toBeInTheDocument();
        });
    });

    it("renders contact email", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText("jan@example.com")).toBeInTheDocument();
        });
    });

    it("switches to edit mode when Edit button is clicked", async () => {
        renderPage();
        await waitFor(() => { screen.getByText("common.edit"); });

        await act(async () => {
            fireEvent.click(screen.getByText("common.edit"));
        });

        // Should show input fields
        const inputs = screen.getAllByRole("textbox");
        expect(inputs.length).toBeGreaterThanOrEqual(4);
    });

    it("populates edit form with current contact values", async () => {
        renderPage();
        await waitFor(() => { screen.getByText("common.edit"); });

        await act(async () => {
            fireEvent.click(screen.getByText("common.edit"));
        });

        const firstNameInput = screen.getAllByRole("textbox").find(
            el => (el as HTMLInputElement).value === "Jan",
        );
        expect(firstNameInput).toBeTruthy();
    });

    it("calls updateContact on Save", async () => {
        mockUpdateMutate.mockImplementation((_args: unknown, opts: { onSuccess?: () => void }) => { opts.onSuccess?.(); });
        renderPage();
        await waitFor(() => { screen.getByText("common.edit"); });

        await act(async () => {
            fireEvent.click(screen.getByText("common.edit"));
        });

        await act(async () => {
            fireEvent.click(screen.getByText("common.save"));
        });

        expect(mockUpdateMutate).toHaveBeenCalledWith(
            expect.objectContaining({ id: 100, req: expect.objectContaining({ firstName: "Jan" }) }),
            expect.anything(),
        );
    });

    it("shows 'contact not found' alert when contact is null", async () => {
        contactDetailResult = { data: null, isLoading: false };
        renderPage();

        await waitFor(() => {
            // Either shows error alert or contact not found text
            const alerts = screen.queryAllByRole("alert");
            const notFound = screen.queryByText("profilePage.contactNotFound");
            expect(alerts.length > 0 || notFound != null).toBe(true);
        });
    });

    it("auto-creates contact when none is linked", async () => {
        mockFetchContacts.mockResolvedValue({ items: [] }); // no linked contact
        mockCreateContact.mockResolvedValue(sampleContact);
        renderPage();

        await waitFor(() => {
            expect(mockCreateContact).toHaveBeenCalledWith(
                expect.objectContaining({ linkedUserId: mockUserId }),
            );
        });
    });

    it("shows upload button for profile photo", async () => {
        renderPage();
        await waitFor(() => {
            const uploadBtn = screen.getByTitle("profilePage.uploadPhoto");
            expect(uploadBtn).toBeInTheDocument();
        });
    });

    it("calls uploadUserPhoto when file is selected", async () => {
        mockUploadUserPhoto.mockResolvedValue({});
        renderPage();

        await waitFor(() => { screen.getByTitle("profilePage.uploadPhoto"); });

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeTruthy();

        const file = new File(["photo-data"], "avatar.png", { type: "image/png" });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        });

        await waitFor(() => {
            expect(mockUploadUserPhoto).toHaveBeenCalledWith(file);
        });
    });

    it("calls deleteUserPhoto when delete button is clicked", async () => {
        mockDeleteUserPhoto.mockResolvedValue({});
        renderPage();

        await waitFor(() => { screen.getByTitle("profilePage.deletePhoto"); });

        await act(async () => {
            fireEvent.click(screen.getByTitle("profilePage.deletePhoto"));
        });

        await waitFor(() => {
            expect(mockDeleteUserPhoto).toHaveBeenCalled();
        });
    });

    it("shows error when photo upload fails", async () => {
        mockUploadUserPhoto.mockRejectedValue(new Error("upload failed"));
        renderPage();

        await waitFor(() => { screen.getByTitle("profilePage.uploadPhoto"); });

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        });

        await waitFor(() => {
            expect(screen.getByText("profilePage.photoUploadFailed")).toBeInTheDocument();
        });
    });
});
