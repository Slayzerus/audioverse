using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using AudioVerse.Domain.Repositories;
using StackExchange.Redis;
using Microsoft.Extensions.DependencyInjection;
using AudioVerse.API.Hubs;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;

namespace AudioVerse.API.Areas.Karaoke.Hubs
{
    /// <summary>
    /// SignalR hub for real-time karaoke functionality.
    /// </summary>
    /// <remarks>
    /// Provides:
    /// - Lobby management (join/leave party rooms)
    /// - Real-time chat within parties
    /// - WebRTC signaling (offer/answer/ice candidates)
    /// - Score updates and leaderboards
    /// - Game state management (rounds, song queue)
    /// - Timeline synchronization for lyrics display
    /// 
    /// Uses Redis (ILobbyStore) for distributed state when available,
    /// falls back to in-memory storage for single-instance deployment.
    /// </remarks>
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class KaraokeHub : Hub
    {
        private readonly AudioVerse.Infrastructure.Realtime.ILobbyStore _lobbyStore;
        private readonly ILogger<KaraokeHub> _logger;
        private readonly IKaraokeRepository _repo;
        private readonly AudioVerse.Application.Services.User.IAuditLogService _auditLogService;

        /// <summary>
        /// In-memory score tracking: eventId -> (playerId -> score).
        /// </summary>
        private static readonly ConcurrentDictionary<int, ConcurrentDictionary<int, int>> _scores = new();

        private static string GroupNameFor(int eventId) => $"event-{eventId}";

        public KaraokeHub(
            AudioVerse.Infrastructure.Realtime.ILobbyStore lobbyStore, 
            ILogger<KaraokeHub> logger, 
            IKaraokeRepository repo, 
            AudioVerse.Application.Services.User.IAuditLogService auditLogService)
        {
            _lobbyStore = lobbyStore;
            _logger = logger;
            _repo = repo;
            _auditLogService = auditLogService;
        }

        private AudioVerse.Infrastructure.Telemetry.IRealtimeMetrics GetRealtimeMetrics()
        {
            try
            {
                return Context.GetHttpContext()?.RequestServices.GetService<AudioVerse.Infrastructure.Telemetry.IRealtimeMetrics>() 
                    ?? new AudioVerse.Infrastructure.Telemetry.InMemoryRealtimeMetrics();
            }
            catch (InvalidOperationException) { return new AudioVerse.Infrastructure.Telemetry.InMemoryRealtimeMetrics(); }
        }

        /// <summary>
        /// Tracks connection memberships for cleanup on disconnect.
        /// Maps connectionId -> set of "{eventId}:{channel}".
        /// </summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _connectionMemberships = new();

        /// <summary>
        /// Rate limiter for timeline RPCs: connectionId -> (count, windowStart).
        /// </summary>
        private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _timelineRate = new();

        private const int TIMELINE_MAX_POINTS_PER_CALL = 500;
        private const int TIMELINE_MAX_CALLS_PER_SECOND = 5;

        /// <summary>
        /// Gets the current authenticated user's ID from JWT claims.
        /// </summary>
        private int? GetCurrentUserId()
        {
            var uid = Context.User?.FindFirst("id")?.Value;
            if (int.TryParse(uid, out var v)) return v;
            return null;
        }

        /// <summary>
        /// Gets the current authenticated user's username from JWT claims.
        /// </summary>
        private string? GetCurrentUsername()
        {
            return Context.User?.FindFirst("username")?.Value;
        }

        /// <summary>
        /// Checks if the current user is the party organizer or an admin.
        /// </summary>
        /// <param name="eventId">Event ID to check</param>
        /// <returns>True if user has elevated permissions</returns>
        private async Task<bool> EnsureOrganizerOrAdminAsync(int eventId)
        {
            var userId = GetCurrentUserId();
            var isAdmin = Context.User?.IsInRole("Admin") ?? false;
            if (isAdmin) return true;
            if (!userId.HasValue) return false;
            var ev = await _repo.GetEventByIdAsync(eventId);
            if (ev == null) return false;
            return ev.OrganizerId == userId.Value;
        }

        // Join a party lobby (adds connection to group and notifies others)
        public async Task JoinLobby(int eventId, string username, string? channel = null)
        {
            var group = GroupFor(eventId, channel);
            await _lobbyStore.AddMemberAsync(eventId, Context.ConnectionId, username, channel);
            await Groups.AddToGroupAsync(Context.ConnectionId, group);
            // Also join the main event broadcast group used by PublishTimelineUpdate,
            // RoundStarted, RoundEnded, ScoreboardUpdated, EventStatusUpdated etc.
            await Groups.AddToGroupAsync(Context.ConnectionId, GroupNameFor(eventId));
            await Clients.Group(group).SendAsync("MemberJoined", new { ConnectionId = Context.ConnectionId, Username = username, Channel = channel });
            await BroadcastLobbyMembers(eventId, channel);

            // audit join
            var uid = GetCurrentUserId();
            var uname = GetCurrentUsername() ?? username;
            await _auditLogService.LogActionAsync(uid, uname ?? "guest", "JoinLobby", $"Joined lobby {eventId}", true);

            // track membership for disconnect cleanup
            var keyVal = $"{eventId}:{(string.IsNullOrEmpty(channel) ? "default" : channel)}";
            var set = _connectionMemberships.GetOrAdd(Context.ConnectionId, _ => new ConcurrentDictionary<string, byte>());
            set[keyVal] = 1;
        }

        // Leave a party lobby
        public async Task LeaveLobby(int eventId, string? channel = null)
        {
            var group = GroupFor(eventId, channel);
            await _lobbyStore.RemoveMemberAsync(eventId, Context.ConnectionId, channel);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
            await Clients.Group(group).SendAsync("MemberLeft", new { ConnectionId = Context.ConnectionId, Channel = channel });
            await BroadcastLobbyMembers(eventId, channel);
            
            // audit leave
            var uid = GetCurrentUserId();
            var uname = GetCurrentUsername();
            await _auditLogService.LogActionAsync(uid, uname ?? "guest", "LeaveLobby", $"Left lobby {eventId}", true);

            // remove membership tracking entry (best-effort)
            var keyVal = $"{eventId}:{(string.IsNullOrEmpty(channel) ? "default" : channel)}";
            if (_connectionMemberships.TryGetValue(Context.ConnectionId, out var existingDict))
            {
                existingDict.TryRemove(keyVal, out _);
                if (existingDict.IsEmpty) _connectionMemberships.TryRemove(Context.ConnectionId, out _);
            }
        }

        // Return current lobby members for a party and channel
        public async Task<List<object>> GetLobbyMembers(int eventId, string? channel = null)
        {
            var members = (await _lobbyStore.GetMembersAsync(eventId, channel)).Select(t => new { ConnectionId = t.ConnectionId, Username = t.Username }).Cast<object>().ToList();
            return members;
        }

        private string GroupFor(int eventId, string? channel) => $"event:{eventId}:lobby:{(string.IsNullOrEmpty(channel) ? "default" : channel)}";

        private async Task BroadcastLobbyMembers(int eventId, string? channel = null)
        {
            var group = GroupFor(eventId, channel);
            var members = (await _lobbyStore.GetMembersAsync(eventId, channel)).Select(t => new { ConnectionId = t.ConnectionId, Username = t.Username }).ToList();
            await Clients.Group(group).SendAsync("LobbyMembersUpdated", members);
        }

        // Chat within a party
        public Task SendChatMessage(int eventId, string user, string message)
        {
            return Clients.Group(GroupNameFor(eventId)).SendAsync("ReceiveChatMessage", user, message, DateTime.UtcNow);
        }

        // WebRTC signaling helpers
        public Task SendOffer(string targetConnectionId, object offer)
        {
            // forward offer to specific peer and include sender id
            return Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", Context.ConnectionId, offer);
        }

        public Task SendAnswer(string targetConnectionId, object answer)
        {
            return Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", Context.ConnectionId, answer);
        }

        public Task SendIceCandidate(string targetConnectionId, object candidate)
        {
            return Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", Context.ConnectionId, candidate);
        }

        // Timeline realtime: publish small batches of pitch/time points
        public async Task<string> GetServerTime() => DateTime.UtcNow.ToString("o");

        public async Task PublishTimelineUpdate(TimelineUpdateDto payload)
        {
            if (payload == null || payload.Points == null || payload.Points.Length == 0)
                throw new HubException("BadRequest: payload empty");

            if (payload.Points.Length > TIMELINE_MAX_POINTS_PER_CALL)
                throw new HubException("TooManyPoints: reduce points per call");

            // rate-limit: prefer Redis if configured for scalability, otherwise fallback to in-memory
            var httpContext = Context.GetHttpContext();
            var mux = httpContext?.RequestServices.GetService<IConnectionMultiplexer>();
            if (mux != null)
            {
                var db = mux.GetDatabase();
                var key = $"timeline_rl:{Context.ConnectionId}:{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
                var count = (long)await db.StringIncrementAsync(key);
                if (count == 1) await db.KeyExpireAsync(key, TimeSpan.FromSeconds(1));
                if (count > TIMELINE_MAX_CALLS_PER_SECOND)
                    throw new HubException("RateLimitExceeded: too many calls");
            }
            else
            {
                // fallback to in-memory limiter
                var rlKey = $"timeline_rl:{Context.ConnectionId}";
                var now = DateTime.UtcNow;
                _timelineRate.AddOrUpdate(rlKey, (1, now), (k, v) =>
                {
                    if ((now - v.WindowStart).TotalSeconds >= 1)
                    {
                        return (1, now);
                    }
                    return (v.Count + 1, v.WindowStart);
                });
                var cur = _timelineRate[rlKey];
                if (cur.Count > TIMELINE_MAX_CALLS_PER_SECOND)
                    throw new HubException("RateLimitExceeded: too many calls");
            }

            // determine party id: prefer payload.EventId, fallback to connection membership
            int eventId = payload.EventId ?? -1;
            if (eventId == -1)
            {
                if (_connectionMemberships.TryGetValue(Context.ConnectionId, out var memberships) && memberships.Any())
                {
                    var first = memberships.Keys.First();
                    if (int.TryParse(first.Split(':')[0], out var pid)) eventId = pid;
                }
            }
            if (eventId == -1) throw new HubException("BadRequest: eventId not provided and cannot be inferred");

            // ensure caller is member of lobby/group (any channel for this event)
            var isMember = _connectionMemberships.TryGetValue(Context.ConnectionId, out var mems)
                && mems.Keys.Any(k => k.StartsWith($"{eventId}:"));
            if (!isMember)
                throw new HubException("Forbidden: not a member of the party");

            // verify that payload.PlayerId belongs to the caller (ownership)
            var userId = Context.User?.FindFirst("id")?.Value;
            if (!int.TryParse(userId, out var uid))
                throw new HubException("Unauthorized: no user id");

            var player = await _repo.GetUserProfilePlayerByIdAsync(payload.PlayerId);
            if (player == null)
                throw new HubException("BadRequest: player not found");
            if (player.ProfileId != uid)
                throw new HubException("Forbidden: player does not belong to caller");

            var serverPayload = new ServerTimelineUpdateDto(
                payload.PlayerId,
                payload.Points,
                DateTime.UtcNow.ToString("o"),
                payload.Seq,
                Context.ConnectionId
            );

            // update metrics and broadcast to others in party (avoid echo)
            var metrics = GetRealtimeMetrics();
            metrics.IncrementPacketsReceived();
            metrics.IncrementPointsReceived(payload.Points.Length);

            await Clients.OthersInGroup(GroupNameFor(eventId)).SendAsync("ReceiveTimelineUpdate", serverPayload);
        }

        // Broadcast party status (general)
        public Task BroadcastEventStatus(int eventId, object status)
        {
            return Clients.Group(GroupNameFor(eventId)).SendAsync("EventStatusUpdated", status);
        }

        // Game events: start/end rounds and update scores
        public async Task StartRound(int eventId, int roundNumber, object metadata)
        {
            var uid = GetCurrentUserId();
            var uname = GetCurrentUsername();

            if (!await EnsureOrganizerOrAdminAsync(eventId))
            {
                await _auditLogService.LogActionAsync(uid, uname ?? "unknown", "StartRound", $"Unauthorized attempt to start round {roundNumber} for party {eventId}", false, "Not authorized");
                await Clients.Caller.SendAsync("Error", "Not authorized to start round");
                return;
            }

            var payload = new { Round = roundNumber, Metadata = metadata, StartedBy = Context.ConnectionId, StartedAt = DateTime.UtcNow };
            await Clients.Group(GroupNameFor(eventId)).SendAsync("RoundStarted", payload);

            await _auditLogService.LogActionAsync(uid, uname ?? "unknown", "StartRound", $"Started round {roundNumber} for party {eventId}", true);
        }

        public async Task EndRound(int eventId, int roundNumber, object results)
        {
            var payload = new { Round = roundNumber, Results = results, EndedAt = DateTime.UtcNow };
            await Clients.Group(GroupNameFor(eventId)).SendAsync("RoundEnded", payload);
            var uid = GetCurrentUserId();
            var uname = GetCurrentUsername();

            if (!await EnsureOrganizerOrAdminAsync(eventId))
            {
                await _auditLogService.LogActionAsync(uid, uname ?? "unknown", "EndRound", $"Unauthorized attempt to end round {roundNumber} for party {eventId}", false, "Not authorized");
                await Clients.Caller.SendAsync("Error", "Not authorized to end round");
                return;
            }

            try
            {
                // Attempt to persist round summary/results to DB via repository
                var round = new AudioVerse.Domain.Entities.Karaoke.KaraokeSessions.KaraokeSessionRound
                {
                    EventId = eventId,
                    Number = roundNumber,
                    CreatedAt = DateTime.UtcNow,
                    StartTime = DateTime.UtcNow
                };
                var roundId = await _repo.AddRoundAsync(round);

                // If results is an array of singing results, attempt to save them
                if (results is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    var singings = new List<KaraokeSinging>();
                    foreach (var item in je.EnumerateArray())
                    {
                        try
                        {
                            var s = System.Text.Json.JsonSerializer.Deserialize<KaraokeSinging>(item.GetRawText());
                            if (s != null)
                            {
                                s.RoundId = roundId;
                                singings.Add(s);
                            }
                        }
                        catch (System.Text.Json.JsonException) { }
                    }
                    if (singings.Any()) await _repo.SaveSingingResultsAsync(singings);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist round results");
            }
        }

        // Update single player's score and broadcast scoreboard
        public async Task UpdateScore(int eventId, int playerId, int score)
        {
            if (!await EnsureOrganizerOrAdminAsync(eventId))
            {
                await Clients.Caller.SendAsync("Error", "Not authorized to update scores");
                return;
            }

            var scores = _scores.GetOrAdd(eventId, _ => new ConcurrentDictionary<int, int>());
            scores[playerId] = score;

            var scoreboard = scores.Select(kvp => new { PlayerId = kvp.Key, Score = kvp.Value }).OrderByDescending(x => x.Score).ToList();
            await Clients.Group(GroupNameFor(eventId)).SendAsync("ScoreboardUpdated", scoreboard);
        }

        // Clean up when connection disconnects
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Connection {Context.ConnectionId} disconnected");

            // Cleanup tracked memberships
            if (_connectionMemberships.TryRemove(Context.ConnectionId, out var memberships))
            {
                foreach (var kv in memberships.Keys)
                {
                    try
                    {
                        var parts = kv.Split(':');
                        if (parts.Length < 2) continue;
                        var eventId = int.Parse(parts[0]);
                        var channel = parts[1];
                        var group = GroupFor(eventId, channel);
                        await _lobbyStore.RemoveMemberAsync(eventId, Context.ConnectionId, channel);
                        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
                        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupNameFor(eventId));
                        await Clients.Group(group).SendAsync("MemberLeft", new { ConnectionId = Context.ConnectionId, Channel = channel });
                        await BroadcastLobbyMembers(eventId, channel);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed cleanup membership for connection {Conn} entry {Entry}", Context.ConnectionId, kv);
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}

