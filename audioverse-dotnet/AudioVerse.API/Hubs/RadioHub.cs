using Microsoft.AspNetCore.SignalR;
using AudioVerse.API.Services.Radio;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Domain.Entities.Radio;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AudioVerse.API.Hubs
{
    public class RadioHub : Hub
    {
        private readonly IRadioService _radioService;
        private readonly ILogger<RadioHub> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public RadioHub(IRadioService radioService, ILogger<RadioHub> logger, IServiceScopeFactory scopeFactory)
        {
            _radioService = radioService;
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task Subscribe(int radioId)
        {
            var connectionId = Context.ConnectionId;
            int? userId = null;
            var uidClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(uidClaim, out var uid)) userId = uid;

            var clientInfo = Context.GetHttpContext()?.Request.Headers["User-Agent"].ToString();
            var remoteIp = Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString();

            var ok = await _radioService.RegisterJoinAsync(radioId, userId, connectionId, clientInfo, remoteIp);
            if (!ok)
            {
                _logger.LogWarning("Rejecting subscription to radio {RadioId} for connection {Conn}", radioId, connectionId);
                await Clients.Caller.SendAsync("JoinRejected", "listener_limit");
                return;
            }

            await Groups.AddToGroupAsync(connectionId, $"radio:{radioId}");

            var now = await _radioService.GetNowPlayingAsync(radioId);
            if (now != null)
            {
                await Clients.Caller.SendAsync("NowPlaying", now);
            }

            // Informuj nowego słuchacza o aktywnej sesji voice
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var liveVoice = await db.VoiceSessions.FirstOrDefaultAsync(v => v.RadioStationId == radioId && v.IsLive);
            if (liveVoice != null)
            {
                await Clients.Caller.SendAsync("VoiceLiveStarted", new { liveVoice.Id, liveVoice.SpeakerUserId, liveVoice.StartUtc });
            }
        }

        public async Task Unsubscribe(int radioId)
        {
            var connectionId = Context.ConnectionId;
            await _radioService.RegisterLeaveAsync(connectionId);
            await Groups.RemoveFromGroupAsync(connectionId, $"radio:{radioId}");
        }

        // ── Voice Live ──

        /// <summary>
        /// DJ sygnalizuje start voice session. Broadcastuje VoiceLiveStarted do słuchaczy.
        /// Wywołujący musi być adminem stacji lub posiadać ważne zaproszenie.
        /// </summary>
        public async Task StartVoice(int radioId)
        {
            int? userId = null;
            var uidClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(uidClaim, out var uid)) userId = uid;

            if (!await IsAuthorizedForVoice(radioId, userId))
            {
                await Clients.Caller.SendAsync("VoiceError", "not_authorized");
                return;
            }

            await Clients.Group($"radio:{radioId}").SendAsync("VoiceLiveStarted", new { radioId, speakerUserId = userId, startUtc = DateTime.UtcNow });
            _logger.LogInformation("Voice started on radio {RadioId} by user {UserId}", radioId, userId);
        }

        /// <summary>
        /// DJ wysyła chunk audio. Backend relay'uje do grupy + opcjonalnie zapisuje.
        /// </summary>
        public async Task SendVoiceChunk(int radioId, byte[] chunk)
        {
            await Clients.OthersInGroup($"radio:{radioId}").SendAsync("VoiceChunk", chunk);
        }

        /// <summary>
        /// DJ kończy voice session. Broadcastuje VoiceLiveStopped.
        /// </summary>
        public async Task StopVoice(int radioId)
        {
            await Clients.Group($"radio:{radioId}").SendAsync("VoiceLiveStopped", new { radioId, stoppedUtc = DateTime.UtcNow });
            _logger.LogInformation("Voice stopped on radio {RadioId}", radioId);
        }

        /// <summary>
        /// Gość dołącza do voice na podstawie tokena zaproszenia (nie musi być zalogowany).
        /// </summary>
        public async Task JoinVoiceAsGuest(int radioId, string inviteToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var invite = await db.RadioStationInvites.FirstOrDefaultAsync(
                i => i.Token == inviteToken && i.RadioStationId == radioId
                     && i.Status == RadioInviteStatus.Accepted);

            if (invite == null || DateTime.UtcNow < invite.ValidFrom || DateTime.UtcNow > invite.ValidTo)
            {
                await Clients.Caller.SendAsync("VoiceError", "invalid_or_expired_invite");
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"radio:{radioId}");
            await Clients.Group($"radio:{radioId}").SendAsync("VoiceLiveStarted", new { radioId, guestName = invite.GuestName ?? invite.Email, startUtc = DateTime.UtcNow });
            _logger.LogInformation("Guest {Email} joined voice on radio {RadioId} with invite {InviteId}", invite.Email, radioId, invite.Id);
        }

        private async Task<bool> IsAuthorizedForVoice(int radioId, int? userId)
        {
            if (userId == null) return false;
            if (Context.User?.IsInRole("Admin") == true) return true;

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var now = DateTime.UtcNow;
            return await db.RadioStationInvites.AnyAsync(
                i => i.RadioStationId == radioId
                     && i.Status == RadioInviteStatus.Accepted
                     && i.ValidFrom <= now && i.ValidTo >= now);
        }

        // ── Chat ──

        /// <summary>
        /// Wyślij wiadomość na chat stacji w real-time. Zapisywana w DB + broadcastowana.
        /// </summary>
        public async Task SendChatMessage(int radioId, string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return;

            int? userId = null;
            var uidClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(uidClaim, out var uid)) userId = uid;

            var displayName = Context.User?.Identity?.Name ?? "Anonim";

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var msg = new RadioChatMessage
            {
                RadioStationId = radioId,
                UserId = userId,
                DisplayName = displayName,
                Content = content,
                MessageType = "text"
            };
            db.RadioChatMessages.Add(msg);
            await db.SaveChangesAsync();

            await Clients.Group($"radio:{radioId}").SendAsync("ChatMessage", new
            {
                msg.Id, msg.DisplayName, msg.Content, msg.MessageType, msg.SentAtUtc, msg.UserId
            });
        }

        /// <summary>
        /// Wyślij reakcję na aktualną piosenkę (broadcast do grupy).
        /// </summary>
        public async Task SendReaction(int radioId, string reactionType)
        {
            int? userId = null;
            var uidClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(uidClaim, out var uid)) userId = uid;

            await Clients.Group($"radio:{radioId}").SendAsync("SongReaction", new
            {
                reactionType, userId, timestampUtc = DateTime.UtcNow
            });
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                await _radioService.RegisterLeaveAsync(Context.ConnectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while handling disconnect");
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
