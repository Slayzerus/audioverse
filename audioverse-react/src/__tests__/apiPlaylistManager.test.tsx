import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../scripts/api/audioverseApiClient", () => ({
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    apiPath: (base: string, path: string) =>
        `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
}));

import { apiClient } from "../scripts/api/audioverseApiClient";
import * as pm from "../scripts/api/apiPlaylistManager";
import { MusicPlatform } from "../models/modelsMusicPlatform";
import type { MutateFnCapture } from "./testUtils";

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
    return new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
}

function Wrapper({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Sample data ───────────────────────────────────────────────

const samplePlaylist = { id: "pl-1", name: "Test Playlist", tracks: [], folderId: null };
const sampleFolder = { id: "f-1", name: "My Folder", color: "#ff0000" };
const sampleTag = { id: "t-1", name: "Chill", color: "#00ff00" };
const sampleTrack = { id: "tr-1", title: "Song A", artist: "Artist A" };
const sampleConnection = { platform: MusicPlatform.Spotify, connected: true, userName: "user1" };

describe("apiPlaylistManager", () => {
    beforeEach(() => vi.clearAllMocks());

    // ══════════════════════════════════════════════════════════
    // Query Keys
    // ══════════════════════════════════════════════════════════

    describe("PM_QK query key factories", () => {
        it("playlists() returns stable key", () => {
            expect(pm.PM_QK.playlists()).toEqual(["pm", "playlists"]);
        });
        it("playlist(id) includes the id", () => {
            expect(pm.PM_QK.playlist("abc")).toEqual(["pm", "playlists", "abc"]);
        });
        it("folders() returns stable key", () => {
            expect(pm.PM_QK.folders()).toEqual(["pm", "folders"]);
        });
        it("tags() returns stable key", () => {
            expect(pm.PM_QK.tags()).toEqual(["pm", "tags"]);
        });
        it("services() returns stable key", () => {
            expect(pm.PM_QK.services()).toEqual(["pm", "services"]);
        });
        it("externalPlaylists(platform) includes platform", () => {
            expect(pm.PM_QK.externalPlaylists(MusicPlatform.Spotify)).toEqual([
                "pm", "external", MusicPlatform.Spotify,
            ]);
        });
        it("externalTracks includes platform and playlistId", () => {
            expect(pm.PM_QK.externalTracks(MusicPlatform.Tidal, "ext-1")).toEqual([
                "pm", "external", MusicPlatform.Tidal, "ext-1",
            ]);
        });
        it("searchTracks includes source and query", () => {
            expect(pm.PM_QK.searchTracks("foo", "local")).toEqual(["pm", "search", "local", "foo"]);
        });
    });

    // ══════════════════════════════════════════════════════════
    // Fetch functions (plain async)
    // ══════════════════════════════════════════════════════════

    describe("fetch functions", () => {
        it("fetchManagedPlaylists calls GET and returns array", async () => {
            get.mockResolvedValue({ data: [samplePlaylist] });
            const result = await pm.fetchManagedPlaylists();
            expect(get).toHaveBeenCalledOnce();
            expect(result).toEqual([samplePlaylist]);
        });

        it("fetchManagedPlaylists returns [] when data is null", async () => {
            get.mockResolvedValue({ data: null });
            expect(await pm.fetchManagedPlaylists()).toEqual([]);
        });

        it("fetchManagedPlaylist calls GET with id", async () => {
            get.mockResolvedValue({ data: samplePlaylist });
            const result = await pm.fetchManagedPlaylist("pl-1");
            expect(get).toHaveBeenCalledOnce();
            expect(result).toEqual(samplePlaylist);
        });

        it("fetchFolders calls GET and returns array", async () => {
            get.mockResolvedValue({ data: [sampleFolder] });
            expect(await pm.fetchFolders()).toEqual([sampleFolder]);
        });

        it("fetchTags calls GET and returns array", async () => {
            get.mockResolvedValue({ data: [sampleTag] });
            expect(await pm.fetchTags()).toEqual([sampleTag]);
        });

        it("fetchServiceConnections calls GET", async () => {
            get.mockResolvedValue({ data: [sampleConnection] });
            expect(await pm.fetchServiceConnections()).toEqual([sampleConnection]);
        });

        it("fetchExternalPlaylists calls GET with platform query", async () => {
            get.mockResolvedValue({ data: [{ id: "ext-1", name: "Likes" }] });
            const result = await pm.fetchExternalPlaylists(MusicPlatform.Spotify);
            expect(get).toHaveBeenCalledOnce();
            expect(result).toHaveLength(1);
        });

        it("fetchExternalPlaylistTracks calls GET with platform + playlistId", async () => {
            get.mockResolvedValue({ data: [{ id: "et-1", title: "Track" }] });
            const result = await pm.fetchExternalPlaylistTracks(MusicPlatform.Tidal, "ext-1");
            expect(get).toHaveBeenCalledOnce();
            expect(result).toHaveLength(1);
        });

        it("searchTracks calls GET with params", async () => {
            get.mockResolvedValue({ data: [sampleTrack] });
            const result = await pm.searchTracks("test", "local", 10);
            expect(get).toHaveBeenCalledWith(expect.any(String), { params: { q: "test", source: "local", limit: 10 } });
            expect(result).toEqual([sampleTrack]);
        });
    });

    // ══════════════════════════════════════════════════════════
    // Mutation functions (plain async)
    // ══════════════════════════════════════════════════════════

    describe("mutation functions", () => {
        it("postCreateManagedPlaylist sends POST", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            const result = await pm.postCreateManagedPlaylist({ name: "New" });
            expect(post).toHaveBeenCalledOnce();
            expect(result).toEqual(samplePlaylist);
        });

        it("putUpdateManagedPlaylist sends PUT with id", async () => {
            put.mockResolvedValue({ data: { ...samplePlaylist, name: "Updated" } });
            const result = await pm.putUpdateManagedPlaylist("pl-1", { name: "Updated" });
            expect(put).toHaveBeenCalledOnce();
            expect(result.name).toBe("Updated");
        });

        it("deleteManagedPlaylist sends DELETE", async () => {
            del.mockResolvedValue({});
            await pm.deleteManagedPlaylist("pl-1");
            expect(del).toHaveBeenCalledOnce();
        });

        it("postDuplicatePlaylist sends POST", async () => {
            post.mockResolvedValue({ data: { ...samplePlaylist, id: "pl-2" } });
            const result = await pm.postDuplicatePlaylist("pl-1");
            expect(post).toHaveBeenCalledOnce();
            expect(result.id).toBe("pl-2");
        });

        it("postAddTracks sends POST with tracks payload", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            await pm.postAddTracks("pl-1", [sampleTrack]);
            expect(post).toHaveBeenCalledWith(expect.any(String), { tracks: [sampleTrack] });
        });

        it("deleteRemoveTracks sends DELETE with trackIds", async () => {
            del.mockResolvedValue({});
            await pm.deleteRemoveTracks("pl-1", ["tr-1", "tr-2"]);
            expect(del).toHaveBeenCalledWith(expect.any(String), { data: { trackIds: ["tr-1", "tr-2"] } });
        });

        it("putReorderTracks sends PUT with ordered ids", async () => {
            put.mockResolvedValue({});
            await pm.putReorderTracks("pl-1", ["tr-2", "tr-1"]);
            expect(put).toHaveBeenCalledWith(expect.any(String), { trackIds: ["tr-2", "tr-1"] });
        });

        it("postMoveTracks sends POST with source/target/tracks", async () => {
            post.mockResolvedValue({});
            await pm.postMoveTracks("pl-1", "pl-2", ["tr-1"]);
            expect(post).toHaveBeenCalledWith(expect.any(String), {
                sourcePlaylistId: "pl-1", targetPlaylistId: "pl-2", trackIds: ["tr-1"],
            });
        });

        it("postCopyTracks sends POST with source/target/tracks", async () => {
            post.mockResolvedValue({});
            await pm.postCopyTracks("pl-1", "pl-2", ["tr-1"]);
            expect(post).toHaveBeenCalledWith(expect.any(String), {
                sourcePlaylistId: "pl-1", targetPlaylistId: "pl-2", trackIds: ["tr-1"],
            });
        });

        it("postMergePlaylists sends POST with merge args", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            await pm.postMergePlaylists("pl-1", ["pl-2", "pl-3"], true);
            expect(post).toHaveBeenCalledWith(expect.any(String), {
                targetPlaylistId: "pl-1", sourcePlaylistIds: ["pl-2", "pl-3"], removeDuplicates: true,
            });
        });

        it("postCreateFolder sends POST", async () => {
            post.mockResolvedValue({ data: sampleFolder });
            expect(await pm.postCreateFolder({ name: "F" })).toEqual(sampleFolder);
        });

        it("putUpdateFolder sends PUT", async () => {
            put.mockResolvedValue({ data: { ...sampleFolder, name: "Renamed" } });
            const result = await pm.putUpdateFolder("f-1", { name: "Renamed" });
            expect(result.name).toBe("Renamed");
        });

        it("deleteFolder sends DELETE", async () => {
            del.mockResolvedValue({});
            await pm.deleteFolder("f-1");
            expect(del).toHaveBeenCalledOnce();
        });

        it("putMovePlaylistToFolder sends PUT with folderId", async () => {
            put.mockResolvedValue({});
            await pm.putMovePlaylistToFolder("pl-1", "f-1");
            expect(put).toHaveBeenCalledWith(expect.any(String), { folderId: "f-1" });
        });

        it("postCreateTag sends POST", async () => {
            post.mockResolvedValue({ data: sampleTag });
            expect(await pm.postCreateTag({ name: "Mood" })).toEqual(sampleTag);
        });

        it("putUpdateTag sends PUT", async () => {
            put.mockResolvedValue({ data: { ...sampleTag, name: "Party" } });
            const result = await pm.putUpdateTag("t-1", { name: "Party" });
            expect(result.name).toBe("Party");
        });

        it("deleteTag sends DELETE", async () => {
            del.mockResolvedValue({});
            await pm.deleteTag("t-1");
            expect(del).toHaveBeenCalledOnce();
        });

        it("postTagTracks sends POST with ids", async () => {
            post.mockResolvedValue({});
            await pm.postTagTracks(["tr-1"], ["t-1"]);
            expect(post).toHaveBeenCalledWith(expect.any(String), { trackIds: ["tr-1"], tagIds: ["t-1"] });
        });

        it("postUntagTracks sends POST with ids", async () => {
            post.mockResolvedValue({});
            await pm.postUntagTracks(["tr-1"], ["t-1"]);
            expect(post).toHaveBeenCalledWith(expect.any(String), { trackIds: ["tr-1"], tagIds: ["t-1"] });
        });

        it("postConnectService sends POST with platform", async () => {
            post.mockResolvedValue({ data: { authUrl: "https://example.com/auth" } });
            const result = await pm.postConnectService(MusicPlatform.Spotify);
            expect(result.authUrl).toBe("https://example.com/auth");
        });

        it("postDisconnectService sends POST", async () => {
            post.mockResolvedValue({});
            await pm.postDisconnectService(MusicPlatform.Spotify);
            expect(post).toHaveBeenCalledWith(expect.any(String), { platform: MusicPlatform.Spotify });
        });

        it("postImportExternalPlaylist sends POST", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            const result = await pm.postImportExternalPlaylist(MusicPlatform.Spotify, "ext-1", "f-1");
            expect(post).toHaveBeenCalledWith(expect.any(String), {
                platform: MusicPlatform.Spotify, externalPlaylistId: "ext-1", targetFolderId: "f-1",
            });
            expect(result).toEqual(samplePlaylist);
        });

        it("postExportToService sends POST", async () => {
            post.mockResolvedValue({ data: { url: "https://open.spotify.com/playlist/abc" } });
            const result = await pm.postExportToService("pl-1", MusicPlatform.Spotify);
            expect(result.url).toContain("spotify");
        });

        it("fetchExportPlaylistFile sends POST with options", async () => {
            const exportData = { playlists: [], version: 1 };
            post.mockResolvedValue({ data: exportData });
            const result = await pm.fetchExportPlaylistFile(["pl-1"], true);
            expect(post).toHaveBeenCalledWith(expect.any(String), { playlistIds: ["pl-1"], includeFolders: true });
            expect(result).toEqual(exportData);
        });
    });

    // ══════════════════════════════════════════════════════════
    // React Query Hooks — Queries
    // ══════════════════════════════════════════════════════════

    describe("query hooks", () => {
        it("useManagedPlaylistsQuery renders playlist data", async () => {
            get.mockResolvedValue({ data: [samplePlaylist] });
            const qc = makeQC();
            const Test = () => {
                const q = pm.useManagedPlaylistsQuery();
                return <div>{q.data ? q.data.length : "loading"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
        });

        it("useManagedPlaylistQuery renders single playlist", async () => {
            get.mockResolvedValue({ data: samplePlaylist });
            const qc = makeQC();
            const Test = () => {
                const q = pm.useManagedPlaylistQuery("pl-1");
                return <div>{q.data ? q.data.name : "loading"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("Test Playlist")).toBeInTheDocument());
        });

        it("useManagedPlaylistQuery is disabled when id is empty", async () => {
            const qc = makeQC();
            const Test = () => {
                const q = pm.useManagedPlaylistQuery("");
                return <div>{q.fetchStatus === "idle" ? "disabled" : "fetching"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("disabled")).toBeInTheDocument());
            expect(get).not.toHaveBeenCalled();
        });

        it("useFoldersQuery renders folders", async () => {
            get.mockResolvedValue({ data: [sampleFolder] });
            const qc = makeQC();
            const Test = () => {
                const q = pm.useFoldersQuery();
                return <div>{q.data ? q.data[0].name : "loading"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("My Folder")).toBeInTheDocument());
        });

        it("useTagsQuery renders tags", async () => {
            get.mockResolvedValue({ data: [sampleTag] });
            const qc = makeQC();
            const Test = () => {
                const q = pm.useTagsQuery();
                return <div>{q.data ? q.data[0].name : "loading"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("Chill")).toBeInTheDocument());
        });

        it("useServiceConnectionsQuery renders connections", async () => {
            get.mockResolvedValue({ data: [sampleConnection] });
            const qc = makeQC();
            const Test = () => {
                const q = pm.useServiceConnectionsQuery();
                return <div>{q.data ? q.data.length : "loading"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
        });

        it("useSearchTracksQuery is disabled when query is too short", async () => {
            const qc = makeQC();
            const Test = () => {
                const q = pm.useSearchTracksQuery("a", "local");
                return <div>{q.fetchStatus === "idle" ? "disabled" : "fetching"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("disabled")).toBeInTheDocument());
            expect(get).not.toHaveBeenCalled();
        });

        it("useSearchTracksQuery fetches when query is long enough", async () => {
            get.mockResolvedValue({ data: [sampleTrack] });
            const qc = makeQC();
            const Test = () => {
                const q = pm.useSearchTracksQuery("test song", "local");
                return <div>{q.data ? q.data.length : "loading"}</div>;
            };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
        });
    });

    // ══════════════════════════════════════════════════════════
    // React Query Hooks — Mutations
    // ══════════════════════════════════════════════════════════

    describe("mutation hooks", () => {
        it("useCreateManagedPlaylistMutation calls POST", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useCreateManagedPlaylistMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ name: "New" }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useUpdateManagedPlaylistMutation calls PUT", async () => {
            put.mockResolvedValue({ data: samplePlaylist });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useUpdateManagedPlaylistMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ id: "pl-1", name: "Updated" }); });
            expect(put).toHaveBeenCalledOnce();
        });

        it("useDeleteManagedPlaylistMutation calls DELETE", async () => {
            del.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useDeleteManagedPlaylistMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn("pl-1"); });
            expect(del).toHaveBeenCalledOnce();
        });

        it("useDuplicatePlaylistMutation calls POST", async () => {
            post.mockResolvedValue({ data: { ...samplePlaylist, id: "pl-dup" } });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useDuplicatePlaylistMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn("pl-1"); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useAddTracksMutation calls POST with tracks", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useAddTracksMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ playlistId: "pl-1", tracks: [sampleTrack] }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useRemoveTracksMutation calls DELETE", async () => {
            del.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useRemoveTracksMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ playlistId: "pl-1", trackIds: ["tr-1"] }); });
            expect(del).toHaveBeenCalledOnce();
        });

        it("useReorderTracksMutation calls PUT", async () => {
            put.mockResolvedValue({});
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useReorderTracksMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ playlistId: "pl-1", trackIds: ["tr-2", "tr-1"] }); });
            expect(put).toHaveBeenCalledOnce();
        });

        it("useMoveTracksMutation calls POST", async () => {
            post.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useMoveTracksMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ sourcePlaylistId: "pl-1", targetPlaylistId: "pl-2", trackIds: ["tr-1"] }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useCopyTracksMutation calls POST", async () => {
            post.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useCopyTracksMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ sourcePlaylistId: "pl-1", targetPlaylistId: "pl-2", trackIds: ["tr-1"] }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useMergePlaylistsMutation calls POST", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useMergePlaylistsMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ targetPlaylistId: "pl-1", sourcePlaylistIds: ["pl-2"], removeDuplicates: true }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useCreateFolderMutation calls POST", async () => {
            post.mockResolvedValue({ data: sampleFolder });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useCreateFolderMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ name: "Folder" }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useUpdateFolderMutation calls PUT", async () => {
            put.mockResolvedValue({ data: sampleFolder });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useUpdateFolderMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ id: "f-1", name: "Renamed" }); });
            expect(put).toHaveBeenCalledOnce();
        });

        it("useDeleteFolderMutation calls DELETE", async () => {
            del.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useDeleteFolderMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn("f-1"); });
            expect(del).toHaveBeenCalledOnce();
        });

        it("useMovePlaylistToFolderMutation calls PUT", async () => {
            put.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useMovePlaylistToFolderMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ playlistId: "pl-1", folderId: "f-1" }); });
            expect(put).toHaveBeenCalledOnce();
        });

        it("useCreateTagMutation calls POST", async () => {
            post.mockResolvedValue({ data: sampleTag });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useCreateTagMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ name: "Tag" }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useUpdateTagMutation calls PUT", async () => {
            put.mockResolvedValue({ data: sampleTag });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useUpdateTagMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ id: "t-1", name: "Updated" }); });
            expect(put).toHaveBeenCalledOnce();
        });

        it("useDeleteTagMutation calls DELETE", async () => {
            del.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useDeleteTagMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn("t-1"); });
            expect(del).toHaveBeenCalledOnce();
        });

        it("useConnectServiceMutation calls POST", async () => {
            post.mockResolvedValue({ data: { authUrl: "https://auth.example.com" } });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useConnectServiceMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn(MusicPlatform.Spotify); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useDisconnectServiceMutation calls POST", async () => {
            post.mockResolvedValue({});
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useDisconnectServiceMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn(MusicPlatform.Spotify); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useImportExternalPlaylistMutation calls POST", async () => {
            post.mockResolvedValue({ data: samplePlaylist });
            get.mockResolvedValue({ data: [] });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useImportExternalPlaylistMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ platform: MusicPlatform.Tidal, externalPlaylistId: "ext-1" }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useExportToServiceMutation calls POST", async () => {
            post.mockResolvedValue({ data: { url: "https://open.spotify.com/pl" } });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useExportToServiceMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ playlistId: "pl-1", platform: MusicPlatform.Spotify }); });
            expect(post).toHaveBeenCalledOnce();
        });

        it("useExportPlaylistFileMutation calls POST", async () => {
            post.mockResolvedValue({ data: { playlists: [], version: 1 } });
            const qc = makeQC();
            let mutateFn: MutateFnCapture;
            const Test = () => { const m = pm.useExportPlaylistFileMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
            render(<Wrapper qc={qc}><Test /></Wrapper>);
            await act(async () => { await mutateFn({ playlistIds: ["pl-1"], includeFolders: false }); });
            expect(post).toHaveBeenCalledOnce();
        });
    });
});
