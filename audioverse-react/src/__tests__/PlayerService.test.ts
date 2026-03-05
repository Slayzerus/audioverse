/**
 * PlayerService unit tests.
 *
 * Validates delegation to apiUser for all CRUD operations,
 * profileId/playerId guard checks, and getPhotoUrl sync helper.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock apiUser ──
vi.mock("../scripts/api/apiUser", () => ({
    default: {
        getProfilePlayers: vi.fn(),
        createProfilePlayer: vi.fn(),
        updateProfilePlayer: vi.fn(),
        uploadPlayerPhoto: vi.fn(),
        getPlayerPhotoUrl: vi.fn(),
        deleteProfilePlayer: vi.fn(),
        setProfilePlayerPrimary: vi.fn(),
    },
}));

import { PlayerService } from "../services/PlayerService";
import apiUser from "../scripts/api/apiUser";
const mockApiUser = vi.mocked(apiUser);

beforeEach(() => {
    vi.clearAllMocks();
});

// ══════════════════════════════════════════════
// getAll
// ══════════════════════════════════════════════
describe("PlayerService.getAll", () => {
    it("returns players array from response", async () => {
        mockApiUser.getProfilePlayers.mockResolvedValue({ players: [{ id: 1, name: "Alice" }] });
        const result = await PlayerService.getAll(10);
        expect(mockApiUser.getProfilePlayers).toHaveBeenCalledWith(10);
        expect(result).toEqual([{ id: 1, name: "Alice" }]);
    });

    it("returns raw response if no .players property", async () => {
        const raw = [{ id: 2, name: "Bob" }];
        mockApiUser.getProfilePlayers.mockResolvedValue(raw);
        const result = await PlayerService.getAll(10);
        expect(result).toEqual(raw);
    });

    it("throws when profileId is 0/falsy", async () => {
        await expect(PlayerService.getAll(0)).rejects.toThrow("profileId required");
    });
});

// ══════════════════════════════════════════════
// create
// ══════════════════════════════════════════════
describe("PlayerService.create", () => {
    it("delegates to apiUser.createProfilePlayer", async () => {
        const player = { name: "New Player", color: "#ff0000" };
        mockApiUser.createProfilePlayer.mockResolvedValue({ id: 5, ...player });
        const result = await PlayerService.create(10, player);
        expect(mockApiUser.createProfilePlayer).toHaveBeenCalledWith(10, player);
        expect(result).toEqual({ id: 5, ...player });
    });

    it("throws when profileId is 0/falsy", async () => {
        await expect(PlayerService.create(0, { name: "X" })).rejects.toThrow("profileId required");
    });
});

// ══════════════════════════════════════════════
// update
// ══════════════════════════════════════════════
describe("PlayerService.update", () => {
    it("delegates to apiUser.updateProfilePlayer", async () => {
        const updates = { name: "Updated" };
        mockApiUser.updateProfilePlayer.mockResolvedValue({ id: 3, name: "Updated" });
        const result = await PlayerService.update(10, 3, updates);
        expect(mockApiUser.updateProfilePlayer).toHaveBeenCalledWith(10, 3, updates);
        expect(result).toEqual({ id: 3, name: "Updated" });
    });

    it("throws when profileId is 0/falsy", async () => {
        await expect(PlayerService.update(0, 3, {})).rejects.toThrow("profileId required");
    });

    it("throws when playerId is 0/falsy", async () => {
        await expect(PlayerService.update(10, 0, {})).rejects.toThrow("playerId required");
    });
});

// ══════════════════════════════════════════════
// uploadPhoto
// ══════════════════════════════════════════════
describe("PlayerService.uploadPhoto", () => {
    it("delegates to apiUser.uploadPlayerPhoto", async () => {
        const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
        mockApiUser.uploadPlayerPhoto.mockResolvedValue({ url: "/photos/3.jpg" });
        const result = await PlayerService.uploadPhoto(10, 3, file);
        expect(mockApiUser.uploadPlayerPhoto).toHaveBeenCalledWith(10, 3, file);
        expect(result).toEqual({ url: "/photos/3.jpg" });
    });

    it("throws when profileId is 0/falsy", async () => {
        const file = new File(["x"], "f.jpg");
        await expect(PlayerService.uploadPhoto(0, 3, file)).rejects.toThrow("profileId required");
    });

    it("throws when playerId is 0/falsy", async () => {
        const file = new File(["x"], "f.jpg");
        await expect(PlayerService.uploadPhoto(10, 0, file)).rejects.toThrow("playerId required");
    });
});

// ══════════════════════════════════════════════
// getPhotoUrl
// ══════════════════════════════════════════════
describe("PlayerService.getPhotoUrl", () => {
    it("returns url from apiUser.getPlayerPhotoUrl", () => {
        mockApiUser.getPlayerPhotoUrl.mockReturnValue("/api/players/42/photo");
        const url = PlayerService.getPhotoUrl(42);
        expect(mockApiUser.getPlayerPhotoUrl).toHaveBeenCalledWith(42);
        expect(url).toBe("/api/players/42/photo");
    });
});

// ══════════════════════════════════════════════
// delete
// ══════════════════════════════════════════════
describe("PlayerService.delete", () => {
    it("delegates to apiUser.deleteProfilePlayer", async () => {
        mockApiUser.deleteProfilePlayer.mockResolvedValue({ success: true });
        const result = await PlayerService.delete(10, 3);
        expect(mockApiUser.deleteProfilePlayer).toHaveBeenCalledWith(10, 3);
        expect(result).toEqual({ success: true });
    });

    it("throws when profileId is 0/falsy", async () => {
        await expect(PlayerService.delete(0, 3)).rejects.toThrow("profileId required");
    });

    it("throws when playerId is 0/falsy", async () => {
        await expect(PlayerService.delete(10, 0)).rejects.toThrow("playerId required");
    });
});

// ══════════════════════════════════════════════
// setPrimary
// ══════════════════════════════════════════════
describe("PlayerService.setPrimary", () => {
    it("delegates to apiUser.setProfilePlayerPrimary", async () => {
        mockApiUser.setProfilePlayerPrimary.mockResolvedValue({ success: true });
        const result = await PlayerService.setPrimary(10, 3);
        expect(mockApiUser.setProfilePlayerPrimary).toHaveBeenCalledWith(10, 3);
        expect(result).toEqual({ success: true });
    });

    it("throws when profileId is 0/falsy", async () => {
        await expect(PlayerService.setPrimary(0, 3)).rejects.toThrow("profileId required");
    });

    it("throws when playerId is 0/falsy", async () => {
        await expect(PlayerService.setPrimary(10, 0)).rejects.toThrow("playerId required");
    });
});
