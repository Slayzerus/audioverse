/**
 * RTCService unit tests.
 *
 * Validates SignalR HubConnection lifecycle, generic invoke/on/off,
 * lobby helpers, WebRTC signaling, game events, timeline sync, and
 * clock-offset computation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock SignalR (hoisted so vi.mock factory can reference them) ──
const { mockConnection } = vi.hoisted(() => {
    const mockConnection = {
        state: "Disconnected" as string,
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        invoke: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
    };
    return { mockConnection };
});

vi.mock("@microsoft/signalr", () => {
    class MockBuilder {
        withUrl = vi.fn().mockReturnThis();
        withAutomaticReconnect = vi.fn().mockReturnThis();
        configureLogging = vi.fn().mockReturnThis();
        build = vi.fn(() => mockConnection);
    }
    return {
        HubConnectionBuilder: MockBuilder,
        LogLevel: { Information: 1 },
    };
});

import { RTCService } from "../services/rtcService";

let svc: RTCService;

beforeEach(() => {
    vi.clearAllMocks();
    mockConnection.state = "Disconnected";
    mockConnection.start.mockResolvedValue(undefined);
    mockConnection.stop.mockResolvedValue(undefined);
    mockConnection.invoke.mockResolvedValue(undefined);
    svc = new RTCService("/test-hub");
});

// ══════════════════════════════════════════════
// Connection lifecycle
// ══════════════════════════════════════════════
describe("connection lifecycle", () => {
    it("connect builds and starts a hub connection", async () => {
        const conn = await svc.connect();
        expect(mockConnection.start).toHaveBeenCalled();
        expect(conn).toBe(mockConnection);
    });

    it("connect with accessTokenFactory still connects", async () => {
        const tokenFn = () => "test-token";
        const conn = await svc.connect(tokenFn);
        expect(mockConnection.start).toHaveBeenCalled();
        expect(conn).toBe(mockConnection);
    });

    it("returns existing connection if already connected", async () => {
        mockConnection.state = "Connected";
        // First connect
        await svc.connect();
        // Second connect should reuse
        const conn2 = await svc.connect();
        expect(conn2).toBe(mockConnection);
        expect(mockConnection.start).toHaveBeenCalledTimes(1);
    });

    it("disconnect stops the connection", async () => {
        await svc.connect();
        await svc.disconnect();
        expect(mockConnection.stop).toHaveBeenCalled();
    });

    it("disconnect is safe when no connection exists", async () => {
        await expect(svc.disconnect()).resolves.toBeUndefined();
    });

    it("isConnected returns false before connect", () => {
        expect(svc.isConnected()).toBe(false);
    });

    it("isConnected returns true when state is Connected", async () => {
        await svc.connect();
        mockConnection.state = "Connected";
        expect(svc.isConnected()).toBe(true);
    });
});

// ══════════════════════════════════════════════
// Generic invoke / on / off
// ══════════════════════════════════════════════
describe("invoke / on / off", () => {
    it("invoke throws if not connected", async () => {
        await expect(svc.invoke("Foo")).rejects.toThrow("not established");
    });

    it("invoke delegates to connection.invoke", async () => {
        await svc.connect();
        mockConnection.invoke.mockResolvedValue("result");
        const res = await svc.invoke("TestMethod", 1, "arg2");
        expect(mockConnection.invoke).toHaveBeenCalledWith("TestMethod", 1, "arg2");
        expect(res).toBe("result");
    });

    it("on delegates to connection.on", async () => {
        await svc.connect();
        const handler = vi.fn();
        svc.on("TestEvent", handler);
        expect(mockConnection.on).toHaveBeenCalledWith("TestEvent", handler);
    });

    it("off delegates to connection.off with handler", async () => {
        await svc.connect();
        const handler = vi.fn();
        svc.off("TestEvent", handler);
        expect(mockConnection.off).toHaveBeenCalledWith("TestEvent", handler);
    });

    it("off delegates to connection.off without handler", async () => {
        await svc.connect();
        svc.off("TestEvent");
        expect(mockConnection.off).toHaveBeenCalledWith("TestEvent");
    });
});

// ══════════════════════════════════════════════
// Lobby management
// ══════════════════════════════════════════════
describe("lobby management", () => {
    beforeEach(async () => {
        await svc.connect();
    });

    it("joinLobby invokes JoinLobby with eventId and username", async () => {
        await svc.joinLobby(1, "Alice");
        expect(mockConnection.invoke).toHaveBeenCalledWith("JoinLobby", 1, "Alice");
    });

    it("joinLobby with channel passes 3 args", async () => {
        await svc.joinLobby(1, "Alice", "music");
        expect(mockConnection.invoke).toHaveBeenCalledWith("JoinLobby", 1, "Alice", "music");
    });

    it("leaveLobby invokes LeaveLobby", async () => {
        await svc.leaveLobby(1);
        expect(mockConnection.invoke).toHaveBeenCalledWith("LeaveLobby", 1);
    });

    it("getLobbyMembers invokes GetLobbyMembers", async () => {
        await svc.getLobbyMembers(1);
        expect(mockConnection.invoke).toHaveBeenCalledWith("GetLobbyMembers", 1);
    });
});

// ══════════════════════════════════════════════
// Chat & WebRTC signaling
// ══════════════════════════════════════════════
describe("chat & WebRTC signaling", () => {
    beforeEach(async () => {
        await svc.connect();
    });

    it("sendChatMessage invokes SendChatMessage", async () => {
        await svc.sendChatMessage(1, "Alice", "Hello!");
        expect(mockConnection.invoke).toHaveBeenCalledWith("SendChatMessage", 1, "Alice", "Hello!");
    });

    it("sendOffer invokes SendOffer", async () => {
        const offer = { type: "offer" as RTCSdpType, sdp: "sdp-data" };
        await svc.sendOffer("conn-123", offer);
        expect(mockConnection.invoke).toHaveBeenCalledWith("SendOffer", "conn-123", offer);
    });

    it("sendAnswer invokes SendAnswer", async () => {
        const answer = { type: "answer" as RTCSdpType, sdp: "sdp-data" };
        await svc.sendAnswer("conn-123", answer);
        expect(mockConnection.invoke).toHaveBeenCalledWith("SendAnswer", "conn-123", answer);
    });

    it("sendIceCandidate invokes SendIceCandidate", async () => {
        const candidate = { candidate: "candidate-data", sdpMid: "0", sdpMLineIndex: 0 };
        await svc.sendIceCandidate("conn-123", candidate);
        expect(mockConnection.invoke).toHaveBeenCalledWith("SendIceCandidate", "conn-123", candidate);
    });
});

// ══════════════════════════════════════════════
// Game events
// ══════════════════════════════════════════════
describe("game events", () => {
    beforeEach(async () => {
        await svc.connect();
    });

    it("startRound invokes StartRound with metadata", async () => {
        await svc.startRound(1, 3, { songId: 42 });
        expect(mockConnection.invoke).toHaveBeenCalledWith("StartRound", 1, 3, { songId: 42 });
    });

    it("startRound invokes StartRound with null when no metadata", async () => {
        await svc.startRound(1, 3);
        expect(mockConnection.invoke).toHaveBeenCalledWith("StartRound", 1, 3, null);
    });

    it("endRound invokes EndRound", async () => {
        await svc.endRound(1, 3, { winner: "Alice" });
        expect(mockConnection.invoke).toHaveBeenCalledWith("EndRound", 1, 3, { winner: "Alice" });
    });

    it("updateScore invokes UpdateScore", async () => {
        await svc.updateScore(1, 5, 9500);
        expect(mockConnection.invoke).toHaveBeenCalledWith("UpdateScore", 1, 5, 9500);
    });
});

// ══════════════════════════════════════════════
// Timeline sync
// ══════════════════════════════════════════════
describe("timeline sync", () => {
    beforeEach(async () => {
        await svc.connect();
    });

    it("publishTimelineUpdate invokes PublishTimelineUpdate", async () => {
        const payload = { position: 42, playing: true };
        await svc.publishTimelineUpdate(payload);
        expect(mockConnection.invoke).toHaveBeenCalledWith("PublishTimelineUpdate", payload);
    });

    it("onTimelineUpdate subscribes to ReceiveTimelineUpdate", () => {
        const handler = vi.fn();
        svc.onTimelineUpdate(handler);
        expect(mockConnection.on).toHaveBeenCalledWith("ReceiveTimelineUpdate", handler);
    });

    it("offTimelineUpdate unsubscribes from ReceiveTimelineUpdate", () => {
        const handler = vi.fn();
        svc.offTimelineUpdate(handler);
        expect(mockConnection.off).toHaveBeenCalledWith("ReceiveTimelineUpdate", handler);
    });
});

// ══════════════════════════════════════════════
// Clock sync
// ══════════════════════════════════════════════
describe("clock sync", () => {
    beforeEach(async () => {
        await svc.connect();
    });

    it("getServerTime invokes GetServerTime and returns string", async () => {
        mockConnection.invoke.mockResolvedValue("2025-01-01T00:00:00Z");
        const result = await svc.getServerTime();
        expect(result).toBe("2025-01-01T00:00:00Z");
    });

    it("computeClockOffset returns numeric offset", async () => {
        // Mock GetServerTime to return current-ish time
        const now = new Date().toISOString();
        mockConnection.invoke.mockResolvedValue(now);
        const offset = await svc.computeClockOffset(1);
        expect(typeof offset).toBe("number");
    });

    it("computeClockOffset throws when not connected", async () => {
        const disconnected = new RTCService("/test");
        await expect(disconnected.computeClockOffset()).rejects.toThrow("not connected");
    });
});
