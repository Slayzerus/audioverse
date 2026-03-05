using MediatR;
using AudioVerse.Infrastructure.Storage;
using Amazon.S3;
using SixLabors.ImageSharp;
using Microsoft.AspNetCore.Mvc;
using AudioVerse.Domain.Enums;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.SignalR;
using AudioVerse.API.Areas.Karaoke.Hubs;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using Microsoft.AspNetCore.Authorization;

namespace AudioVerse.API.Areas.Karaoke.Controllers
{
    [ApiController]
    [Route("api/karaoke")]
    [Produces("application/json")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class KaraokeController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<KaraokeController> _logger;
        private readonly AudioVerse.Application.Services.User.IAuditLogService _auditLogService;
        private readonly IHubContext<KaraokeHub> _hubContext;
        private readonly AudioVerse.Infrastructure.Storage.IFileStorage? _fileStorage;

        public KaraokeController(IMediator mediator, ILogger<KaraokeController> logger, AudioVerse.Application.Services.User.IAuditLogService auditLogService, IHubContext<KaraokeHub> hubContext, AudioVerse.Infrastructure.Storage.IFileStorage? fileStorage = null)
        {
            _mediator = mediator;
            _logger = logger;
            _auditLogService = auditLogService;
            _hubContext = hubContext;
            _fileStorage = fileStorage;
        }

        /// <summary>
        /// Add a player to a round (assign a slot).
        /// </summary>
        /// <param name="roundId">Round identifier</param>
        /// <param name="request">Request model containing player id and optional slot</param>
        /// <returns>Created assignment id</returns>
        [HttpPost("rounds/{roundId}/players")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> AddRoundPlayer(int roundId, [FromBody] AudioVerse.Application.Models.Requests.Karaoke.AddRoundPlayerRequest request)
        {
            if (request == null) return BadRequest();
            // verify caller owns the player
            var uid = User.FindFirst("id")?.Value;
            if (!int.TryParse(uid, out var userId)) return Unauthorized();
            var player = await _mediator.Send(new AudioVerse.Application.Queries.User.GetUserProfilePlayerByIdQuery(request.PlayerId));
            if (player == null) return BadRequest(new { Success = false, Message = "Player not found" });
            if (player.ProfileId != userId && !User.IsInRole("Admin")) return Forbid();

            var rp = new AudioVerse.Domain.Entities.Karaoke.KaraokeSessions.KaraokeSessionRoundPlayer { RoundId = roundId, PlayerId = request.PlayerId, Slot = request.Slot, MicDeviceId = request.MicDeviceId, JoinedAt = DateTime.UtcNow };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.AddRoundPlayerCommand(rp));
            return CreatedAtAction(nameof(GetRoundPlayers), new { roundId = roundId }, new { Success = true, Id = id });
        }

        /// <summary>
        /// List players assigned to a round.
        /// </summary>
        /// <param name="roundId">Round identifier</param>
        /// <returns>List of assigned players with nested player info and karaoke settings</returns>
        [HttpGet("rounds/{roundId}/players")]
        [ProducesResponseType(typeof(IEnumerable<AudioVerse.Application.Models.Dtos.KaraokeRoundPlayerDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> GetRoundPlayers(int roundId)
        {
            var players = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetRoundPlayersQuery(roundId));
            var dto = players.Select(p => new AudioVerse.Application.Models.Dtos.KaraokeRoundPlayerDto
            {
                Id = p.Id,
                RoundId = p.RoundId,
                PlayerId = p.PlayerId,
                Slot = p.Slot,
                JoinedAt = p.JoinedAt,
                MicDeviceId = p.MicDeviceId,
                Player = MapPlayerDto(p.Player)
            });
            return Ok(dto);
        }

        /// <summary>
        /// Get players assigned to a round that belong to a specific user.
        /// A user (profile owner) may have multiple players in the same round.
        /// </summary>
        /// <param name="roundId">Round identifier</param>
        /// <param name="userId">User profile ID (UserProfile.Id / ProfileId)</param>
        /// <returns>Player assignments with nested player info and karaoke settings</returns>
        [HttpGet("rounds/{roundId}/users/{userId}/players")]
        [ProducesResponseType(typeof(IEnumerable<AudioVerse.Application.Models.Dtos.KaraokeRoundPlayerDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> GetRoundPlayersByUser(int roundId, int userId)
        {
            var players = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetRoundPlayersByRoundAndUserQuery(roundId, userId));
            var dto = players.Select(p => new AudioVerse.Application.Models.Dtos.KaraokeRoundPlayerDto
            {
                Id = p.Id,
                RoundId = p.RoundId,
                PlayerId = p.PlayerId,
                Slot = p.Slot,
                JoinedAt = p.JoinedAt,
                MicDeviceId = p.MicDeviceId,
                Player = MapPlayerDto(p.Player)
            });
            return Ok(dto);
        }


        /// <summary>
        /// Remove a player assignment from a round.
        /// </summary>
        /// <param name="roundId">Round identifier</param>
        /// <param name="id">Assignment id (KaraokeRoundPlayer.Id)</param>
        [HttpDelete("rounds/{roundId}/players/{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> RemoveRoundPlayer(int roundId, int id)
        {
            // authorization: allow owner of player or organizer or admin
            var assignment = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetRoundPlayersQuery(roundId));
            var item = assignment.FirstOrDefault(x => x.Id == id);
            if (item == null) return NotFound(new { Success = false });

            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

            // owner of player
            var player = item.Player;
            var isOwner = player != null && player.ProfileId == userId;
            // Resolve event through the round's EventId
            var round = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetRoundByIdQuery(roundId));
            Domain.Entities.Events.Event? ev = null;
            if (round?.EventId is > 0)
                ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(round.EventId.Value));
            var isOrganizer = ev != null && (ev.OrganizerId == userId || (ev.Organizer != null && ev.Organizer.Id == userId));
            var isAdmin = User.IsInRole("Admin");
            if (!isOwner && !isOrganizer && !isAdmin) return Forbid();

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.RemoveRoundPlayerCommand(roundId, id));
            if (!ok) return NotFound(new { Success = false });
            return NoContent();
        }

        /// <summary>
        /// Update slot for a round assignment
        /// </summary>
        /// <param name="roundId">Round identifier</param>
        /// <param name="id">Assignment id (KaraokeRoundPlayer.Id)</param>
        [HttpPatch("rounds/{roundId}/players/{id}/slot")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateRoundPlayerSlot(int roundId, int id, [FromBody] AudioVerse.Application.Models.Requests.Karaoke.UpdateRoundPlayerSlotRequest req)
        {
            if (req == null) return BadRequest();
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.UpdateRoundPlayerSlotCommand(roundId, id, req.Slot));
            if (!ok) return NotFound(new { Success = false });
            return Ok(new { Success = true });
        }

        /// <summary>
        /// Update microphone device assignment for a round player.
        /// </summary>
        /// <param name="roundId">Round identifier</param>
        /// <param name="id">Assignment id (KaraokeRoundPlayer.Id)</param>
        [HttpPatch("rounds/{roundId}/players/{id}/mic")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateRoundPlayerMic(int roundId, int id, [FromBody] AudioVerse.Application.Models.Requests.Karaoke.UpdateRoundPlayerMicRequest req)
        {
            if (req == null) return BadRequest();
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.UpdateRoundPlayerMicCommand(roundId, id, req.MicDeviceId));
            if (!ok) return NotFound(new { Success = false });
            return Ok(new { Success = true });
        }

        /// <summary>
        /// Update party player status (e.g. Waiting -> Inside). Only organizer or Admin can set certain statuses.
        /// </summary>
        // Event-centric: update participant status for an event (replaces /parties/*)
        [HttpPatch("events/{eventId}/participants/{playerId}/status")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> UpdateKaraokePlayerStatus(int eventId, int playerId, [FromBody] AudioVerse.Application.Models.Requests.Karaoke.UpdateKaraokePlayerStatusRequest req)
        {
            if (req == null) return BadRequest();
            var statusVal = req.Status;
            if (!System.Enum.IsDefined(typeof(KaraokePlayerStatus), statusVal)) return BadRequest();
            var status = (KaraokePlayerStatus)statusVal;

            // Authorization: only organizer or Admin can set statuses other than 'Waiting' -> allow owner to set own player's status
            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByEventIdQuery(eventId));
            if (ev == null) return NotFound();

            var isOrganizer = ev.OrganizerId == userId;
            var isAdmin = User.IsInRole("Admin");

            // If requested status is Inside/Outside/Left/Validation, only organizer or admin allowed
            if ((status == KaraokePlayerStatus.Inside || status == KaraokePlayerStatus.Outside || status == KaraokePlayerStatus.Left || status == KaraokePlayerStatus.Validation) && !(isOrganizer || isAdmin))
            {
                return Forbid();
            }

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.UpdateKaraokePlayerStatusCommand(ev.Id, playerId, status));
            if (!ok) return NotFound(new { Success = false });
            return Ok(new { Success = true });
        }

        /// <summary>
        /// Admin: get upload failure metrics
        /// </summary>
        [HttpGet("admin/metrics/upload-failures")]
        public async Task<IActionResult> GetUploadFailureMetrics()
        {
            if (!User.IsInRole("Admin")) return Forbid();
            try
            {
                var metrics = HttpContext?.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Telemetry.IUploadMetrics>();
                var data = metrics?.GetAll() ?? new Dictionary<string, int>();
                // build example messages for frontend
                var examples = new Dictionary<string, string>
                {
                    { "timeout", "Upload timed out after 30s. Please retry." },
                    { "throttling", "Storage throttling (SlowDown). Please retry after a short delay." },
                    { "s3_server_error", "Upstream storage error. Try again later." },
                    { "not_found", "Requested storage object not found." },
                    { "network", "Network error contacting storage." },
                    { "invalid_operation", "Invalid operation during upload." },
                    { "unknown", "Unknown error occurred." }
                };
                var payload = new { Success = true, Failures = data, Examples = examples };
                return Ok(payload);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get upload metrics");
                return StatusCode(500, new { Success = false, Message = "Failed to get metrics" });
            }

        }

        /// <summary>
        /// Admin: list buckets and their public status
        /// </summary>
        [HttpGet("admin/buckets")]
        public async Task<IActionResult> ListBuckets()
        {
            if (!User.IsInRole("Admin")) return Forbid();
            if (!(_fileStorage is IFileStorage fs)) return StatusCode(500, "Storage not configured");

            try
            {
                var buckets = await fs.ListBucketsAsync();
                var list = new List<object>();
                foreach (var b in buckets)
                {
                    var isPublic = await fs.IsBucketPublicAsync(b);
                    list.Add(new { Bucket = b, IsPublic = isPublic });
                }
                return Ok(list);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to list buckets");
                return StatusCode(500, new { Success = false, Message = "Failed to list buckets" });
            }

        }

        /// <summary>
        /// Admin: check if bucket is public
        /// </summary>
        [HttpGet("admin/buckets/{bucket}/public")]
        public async Task<IActionResult> IsBucketPublic(string bucket)
        {
            if (!User.IsInRole("Admin")) return Forbid();
            if (!(_fileStorage is IFileStorage fs)) return StatusCode(500, "Storage not configured");

            try
            {
                var isPublic = await fs.IsBucketPublicAsync(bucket);
                return Ok(new { Bucket = bucket, IsPublic = isPublic });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get public status for bucket {Bucket}", bucket);
                return StatusCode(500, new { Success = false, Message = "Failed to query bucket policy" });
            }
        }

        private IActionResult MapUploadExceptionToResult(Exception ex)
        {
            // timeout
            if (ex is OperationCanceledException || ex is TaskCanceledException)
            {
                return StatusCode(504, new { Success = false, Message = "Upload timed out" });
            }
            if (ex is AmazonS3Exception s3ex)
            {
                var code = (int)s3ex.StatusCode;
                var err = new { Success = false, Message = "Storage error", Detail = s3ex.Message, ErrorCode = s3ex.ErrorCode, RequestId = s3ex.RequestId };
                // SlowDown / throttling or 503 -> Service Unavailable
                if (string.Equals(s3ex.ErrorCode, "SlowDown", StringComparison.OrdinalIgnoreCase) || code == 503)
                    return StatusCode(503, err);
                if (code >= 500)
                    return StatusCode(502, err);
                else if (code == 404)
                    return NotFound(new { Success = false, Message = "Storage object not found", Detail = s3ex.Message, ErrorCode = s3ex.ErrorCode, RequestId = s3ex.RequestId });
                else
                    return StatusCode(502, err);
            }

            if (ex is System.Net.Http.HttpRequestException httpEx)
            {
                return StatusCode(502, new { Success = false, Message = "Network error when contacting storage", Detail = httpEx.Message });
            }

            if (ex is InvalidOperationException)
            {
                // record metric
                try { HttpContext?.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Telemetry.IUploadMetrics>()?.IncrementFailure("invalid_operation"); } catch (InvalidOperationException) { }
                return StatusCode(502, new { Success = false, Message = "Failed to upload to storage", Detail = ex.Message });
            }

            try { HttpContext?.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Telemetry.IUploadMetrics>()?.IncrementFailure("unknown"); } catch (InvalidOperationException) { }
            return StatusCode(500, new { Success = false, Message = "Internal server error during upload", Detail = ex.Message });
        }

        private bool ValidatePoster(IFormFile poster, out string? err)
        {
            err = null;
            if (poster == null) return true;
            var max = int.TryParse(HttpContext?.RequestServices.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>()? ["StorageOptions:Poster:MaxSizeBytes"], out var m) ? m : 5242880;
            var allowed = HttpContext?.RequestServices.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>()?.GetSection("StorageOptions:Poster:AllowedContentTypes").Get<string[]>() ?? new[] { "image/png", "image/jpeg", "image/webp" };
            if (poster.Length > max) { err = "File too large"; return false; }
            if (!allowed.Contains(poster.ContentType)) { err = "Unsupported content type"; return false; }

            // delegate to centralized validator
            try
            {
                var config = HttpContext?.RequestServices.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
                if (!AudioVerse.Infrastructure.Validation.ImageValidator.ValidatePoster(poster, config!, out var verr)) { err = verr; return false; }
            }
            catch (Exception ex) when (ex is ArgumentException or FormatException or InvalidOperationException) { err = "Invalid image data"; return false; }
            return true;
        }

        private static bool IsValidImageMagicBytes(byte[] data)
        {
            if (data.Length < 4) return false;
            // PNG: 89 50 4E 47
            if (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) return true;
            // JPEG: FF D8 FF
            if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) return true;
            // WebP: RIFF .... WEBP
            if (data.Length >= 12 && data[0] == 0x52 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x46 && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50) return true;
            return false;
        }

        private static string? DetectImageType(byte[] data)
        {
            if (data.Length < 4) return null;
            // PNG
            if (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) return "png";
            // JPEG
            if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) return "jpeg";
            // WebP
            if (data.Length >= 12 && data[0] == 0x52 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x46 && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50) return "webp";
            // GIF: GIF8
            if (data[0] == 0x47 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x38) return "gif";
            // BMP: 'BM'
            if (data[0] == 0x42 && data[1] == 0x4D) return "bmp";
            // TIFF little-endian II* (49 49 2A 00) or big-endian MM* (4D 4D 00 2A)
            if (data.Length >= 4 && ((data[0] == 0x49 && data[1] == 0x49 && data[2] == 0x2A && data[3] == 0x00) || (data[0] == 0x4D && data[1] == 0x4D && data[2] == 0x00 && data[3] == 0x2A))) return "tiff";
            return null;
        }

        // Song endpoints moved to KaraokeSongsController

        // Event creation removed: use Events API

        /// <summary>
        /// Remove a player from a party
        /// </summary>
        [HttpDelete("events/{eventId}/participants/{playerId}")]
        public async Task<IActionResult> RemovePlayerFromEvent(int eventId, int playerId)
        {
            // authorization: only organizer or admin or the owner of player can remove
            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByEventIdQuery(eventId));
            if (ev == null) return NotFound();

            var isOrganizer = ev.OrganizerId == userId;
            var isAdmin = User.IsInRole("Admin");

            var player = await _mediator.Send(new AudioVerse.Application.Queries.User.GetUserProfilePlayerByIdQuery(playerId));
            var isOwner = player != null && player.ProfileId == userId;

            if (!isOrganizer && !isAdmin && !isOwner) return Forbid();

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Events.RemoveParticipantFromEventCommand(eventId, playerId));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>
        /// Join a party, verifying code if required
        /// </summary>
        [HttpPost("events/{id}/join")]
        public async Task<IActionResult> JoinEvent(int id, [FromBody] JoinRequest req)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            int? uid = null;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsed)) uid = parsed;

            // prefer Event-centric join: resolve event and use event-based checks if needed
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(id));
            int? eventId = ev?.Id;
            var command = new AudioVerse.Application.Commands.Karaoke.JoinKaraokeSessionCommand(id, uid, req?.Code);
            var allowed = await _mediator.Send(command);
            // Audit log the join attempt
            var username = User.FindFirst("username")?.Value ?? "guest";
            await _auditLogService.LogActionAsync(uid, username, "JoinEvent", allowed ? "Join allowed" : "Join denied", allowed, allowed ? null : "Access denied");

            if (!allowed) return Forbid();
            return Ok(new { Success = true });
        }

        /// <summary>Get rounds for a karaoke session</summary>
        [HttpGet("sessions/{sessionId:int}/rounds")]
        public async Task<IActionResult> GetSessionRounds(int sessionId)
        {
            var rounds = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetSessionRoundsQuery(sessionId));
            return Ok(rounds);
        }

        /// <summary>Reorder rounds within a session</summary>
        [HttpPut("sessions/{sessionId:int}/rounds/reorder")]
        public async Task<IActionResult> ReorderSessionRounds(int sessionId, [FromBody] List<int> roundIds)
        {
            if (roundIds == null || roundIds.Count == 0) return BadRequest(new { Success = false, Message = "roundIds required" });
            var result = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.ReorderSessionRoundsCommand(sessionId, roundIds));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>
        /// Create a new round/turn in a karaoke party
        /// </summary>
        /// <param name="command">Round details (order, settings)</param>
        /// <response code="200">Round created successfully with ID</response>
        [HttpPost("add-round")]
        public async Task<IActionResult> AddRound([FromBody] KaraokeSessionRound round)
        {
            if (round == null) return BadRequest(new { Success = false, Message = "Round payload is required" });
            // If EventId provided, verify the event exists
            if (round.EventId.HasValue && round.EventId > 0)
            {
                var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(round.EventId.Value));
                if (ev == null) return NotFound(new { Success = false, Message = "Event not found" });
            }
            var command = new AudioVerse.Application.Commands.Karaoke.AddKaraokeRoundCommand(round);
            var roundId = await _mediator.Send(command);
            return Ok(new { RoundId = roundId });
        }

        /// <summary>Create a new karaoke session for an event.</summary>
        [HttpPost("add-session")]
        public async Task<IActionResult> AddSession([FromBody] KaraokeSession session)
        {
            if (session == null) return BadRequest(new { Success = false, Message = "Session payload is required" });
            // If EventId not provided, try to resolve from EventId
            if (!session.EventId.HasValue)
            {
                // No EventId on session anymore; require EventId from client
            }
            var cmd = new AudioVerse.Application.Commands.Karaoke.AddKaraokeSessionCommand(session);
            var id = await _mediator.Send(cmd);
            return Ok(new { SessionId = id });
        }

        /// <summary>Add a performance part to a karaoke round.</summary>
        [HttpPost("add-round-part")]
        public async Task<IActionResult> AddRoundPart([FromBody] KaraokeSessionRoundPart part)
        {
            if (part == null) return BadRequest(new { Success = false, Message = "Round part payload is required" });
            var cmd = new AudioVerse.Application.Commands.Karaoke.AddKaraokeRoundPartCommand(part);
            var id = await _mediator.Send(cmd);
            return Ok(new { RoundPartId = id });
        }

        /// <summary>
        /// Add a song to a karaoke round for singing
        /// </summary>
        /// <param name="command">Song ID, round ID, player ID</param>
        /// <response code="200">Song added to round with singing session ID</response>
        [HttpPost("add-song-to-round")]
        public async Task<IActionResult> AddSongToRound([FromBody] AddSongToRoundCommand command)
        {
            var singingId = await _mediator.Send(command);
            return Ok(new { SingingId = singingId });
        }

        /// <summary>
        /// Save singing results/scores for multiple players in batch
        /// </summary>
        /// <param name="commands">List of singing results (player scores, accuracy)</param>
        /// <response code="200">Results saved successfully</response>
        [HttpPost("save-results")]
        public async Task<IActionResult> SaveResults([FromBody] List<KaraokeSinging> singings)
        {
            if (singings == null || !singings.Any()) return BadRequest(new { Success = false, Message = "No singing results provided" });

            // Auth: verify caller owns the player(s) or is Admin
            var uid = User.FindFirst("id")?.Value;
            if (!int.TryParse(uid, out var callerId)) return Unauthorized();
            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin)
            {
                var playerIds = singings.Select(s => s.PlayerId).Distinct();
                foreach (var pid in playerIds)
                {
                    var p = await _mediator.Send(new AudioVerse.Application.Queries.User.GetUserProfilePlayerByIdQuery(pid));
                    if (p == null || p.ProfileId != callerId)
                        return Forbid();
                }
            }

            // Wrap each singing into command expected by the batch handler
            var commands = singings.Select(s => new AudioVerse.Application.Commands.Karaoke.SaveSingingResultsCommand(s)).ToList();
            await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.SaveSingingResultsBatchCommand(commands));
            return Ok();
        }

        /// <summary>
        /// Get a specific karaoke party with all details
        /// </summary>
        /// <param name="id">Event ID</param>
        /// <response code="200">Event details</response>
        /// <response code="404">Event not found</response>
        /// <summary>Get Event.</summary>
        [HttpGet("get-event/{id}")]
        public async Task<IActionResult> GetEvent(int id)
        {
            var dto = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventDtoQuery(id));
            return dto != null ? Ok(dto) : NotFound();
        }

        /// <summary>
        /// Get presigned URL for party poster
        /// </summary>
        [HttpGet("events/{id}/poster-url")]
        public async Task<IActionResult> GetEventPosterUrl(int id, [FromQuery] int validSeconds = 300)
        {
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(id));
            if (ev == null) return NotFound();
            if (string.IsNullOrEmpty(ev.Poster)) return NotFound();

            if (!(_fileStorage is IFileStorage fs)) return StatusCode(500, "Storage not configured");

            var url = await fs.GetPresignedUrlAsync("event-posters", ev.Poster, TimeSpan.FromSeconds(validSeconds));
            return Ok(new { Url = url, ExpiresIn = validSeconds });
        }

        /// <summary>Get public URL for an event poster image.</summary>
        [HttpGet("events/{id}/poster-public-url")]
        public async Task<IActionResult> GetEventPosterPublicUrl(int id)
        {
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByEventIdQuery(id));
            if (ev == null) return NotFound();
            if (string.IsNullOrEmpty(ev.Poster)) return NotFound();
            if (!(_fileStorage is IFileStorage fs)) return StatusCode(500, "Storage not configured");

            var url = fs.GetPublicUrl("event-posters", ev.Poster);
            return Ok(new { Url = url });
        }

        // Songs filtering/search/import moved to KaraokeSongsController

        /// <summary>
        /// Admin: set bucket public or private at runtime
        /// </summary>
        [HttpPost("admin/buckets/{bucket}/public")]
        public async Task<IActionResult> SetBucketPublic(string bucket, [FromQuery] bool makePublic = true)
        {
            if (!User.IsInRole("Admin")) return Forbid();
            if (!(_fileStorage is IFileStorage fs)) return StatusCode(500, "Storage not configured");

            try
            {
                if (makePublic) await fs.SetBucketPublicAsync(bucket);
                else await fs.SetBucketPrivateAsync(bucket);
                return Ok(new { Success = true });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to change public status for bucket {Bucket}", bucket);
                try { HttpContext?.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Telemetry.IUploadMetrics>()?.IncrementFailure("bucket_policy_change"); } catch (InvalidOperationException) { }
                return StatusCode(500, new { Success = false, Message = "Failed to change bucket policy" });
            }
        }

        // Songs CRUD/verified/development/collaborators/versions/filter/search/import moved to KaraokeSongsController

        // Stats endpoints moved to KaraokeStatsController

        // --------------------------------------------------
        //  TEAMS
        // --------------------------------------------------

        /// <summary>Create a karaoke team</summary>
        [HttpPost("teams")]
        [ProducesResponseType(typeof(object), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CreateTeam([FromBody] KaraokeTeam team)
        {
            if (team == null || string.IsNullOrWhiteSpace(team.Name)) return BadRequest();
            var uid = User.FindFirst("id")?.Value;
            if (!int.TryParse(uid, out var userId)) return Unauthorized();
            var player = await _mediator.Send(new AudioVerse.Application.Queries.User.GetUserProfilePlayerByIdQuery(team.CreatedByPlayerId));
            if (player == null) return BadRequest(new { Success = false, Message = "Player not found" });
            if (player.ProfileId != userId && !User.IsInRole("Admin")) return Forbid();

            var id = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.CreateTeamCommand(team));
            return CreatedAtAction(nameof(GetTeam), new { teamId = id }, new { Success = true, Id = id });
        }

        /// <summary>Get a team by id</summary>
        [HttpGet("teams/{teamId}")]
        [ProducesResponseType(typeof(KaraokeTeam), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetTeam(int teamId)
        {
            var team = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetTeamByIdQuery(teamId));
            return team != null ? Ok(team) : NotFound();
        }

        /// <summary>List teams for an event</summary>
        [HttpGet("events/{eventId}/teams")]
        [ProducesResponseType(typeof(IEnumerable<KaraokeTeam>), 200)]
        public async Task<IActionResult> GetTeamsByEvent(int eventId)
        {
            var teams = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetTeamsByEventQuery(eventId));
            return Ok(teams);
        }

        /// <summary>Update a team</summary>
        [HttpPut("teams/{teamId}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateTeam(int teamId, [FromBody] KaraokeTeam team)
        {
            if (team == null) return BadRequest();
            team.Id = teamId;
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.UpdateTeamCommand(team));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a team</summary>
        [HttpDelete("teams/{teamId}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> DeleteTeam(int teamId)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.DeleteTeamCommand(teamId));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Add a player to a team</summary>
        [HttpPost("teams/{teamId}/players")]
        [ProducesResponseType(typeof(object), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AddTeamPlayer(int teamId, [FromBody] AudioVerse.Application.Models.Requests.Karaoke.AddTeamPlayerRequest request)
        {
            if (request == null) return BadRequest();
            var tp = new AudioVerse.Domain.Entities.Karaoke.KaraokeTeams.KaraokeTeamPlayer
            {
                TeamId = teamId,
                PlayerId = request.PlayerId,
                Role = request.Role,
                JoinedAt = DateTime.UtcNow
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.AddTeamPlayerCommand(tp));
            return CreatedAtAction(nameof(GetTeamPlayers), new { teamId }, new { Success = true, Id = id });
        }

        /// <summary>Remove a player from a team</summary>
        [HttpDelete("teams/{teamId}/players/{playerId}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> RemoveTeamPlayer(int teamId, int playerId)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.RemoveTeamPlayerCommand(teamId, playerId));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>List players in a team</summary>
        [HttpGet("teams/{teamId}/players")]
        [ProducesResponseType(typeof(IEnumerable<KaraokeTeamPlayer>), 200)]
        public async Task<IActionResult> GetTeamPlayers(int teamId)
        {
            var players = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetTeamPlayersQuery(teamId));
            return Ok(players);
        }

        // --------------------------------------------------
        //  SONG QUEUE
        // --------------------------------------------------

        /// <summary>Get song queue for an event</summary>
        [HttpGet("events/{eventId}/queue")]
        public async Task<IActionResult> GetSongQueue(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetSongQueueByEventQuery(eventId)));

        /// <summary>Add a song to the queue</summary>
        [HttpPost("events/{eventId}/queue")]
        public async Task<IActionResult> AddToSongQueue(int eventId, [FromBody] KaraokeSongFileQueueItem item)
        {
            if (item == null) return BadRequest();
            item.EventId = eventId;
            item.RequestedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.AddSongQueueItemCommand(item));
            return CreatedAtAction(nameof(GetSongQueue), new { eventId }, new { Id = id });
        }

        /// <summary>Update queue item status (Playing, Done, Skipped)</summary>
        [HttpPatch("queue/{id}/status")]
        public async Task<IActionResult> UpdateQueueItemStatus(int id, [FromBody] AudioVerse.Domain.Enums.SongQueueStatus status)
            => await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.UpdateSongQueueItemStatusCommand(id, status))
                ? Ok(new { Success = true }) : NotFound();

        /// <summary>Remove item from queue</summary>
        [HttpDelete("queue/{id}")]
        public async Task<IActionResult> RemoveFromQueue(int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.RemoveSongQueueItemCommand(id))
                ? NoContent() : NotFound();

        // --------------------------------------------------
        //  FAVORITE SONGS
        // --------------------------------------------------

        /// <summary>Get player's favorite songs</summary>
        [HttpGet("players/{playerId}/favorites")]
        public async Task<IActionResult> GetFavorites(int playerId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetFavoriteSongsQuery(playerId)));

        /// <summary>Add a song to player's favorites</summary>
        [HttpPost("players/{playerId}/favorites/{songId}")]
        public async Task<IActionResult> AddFavorite(int playerId, int songId)
        {
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.AddFavoriteSongCommand(playerId, songId));
            return id > 0 ? Ok(new { Id = id }) : Conflict(new { Message = "Already in favorites" });
        }

        /// <summary>Remove a song from player's favorites</summary>
        [HttpDelete("players/{playerId}/favorites/{songId}")]
        public async Task<IActionResult> RemoveFavorite(int playerId, int songId)
            => await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.RemoveFavoriteSongCommand(playerId, songId))
                ? NoContent() : NotFound();

        /// <summary>Add a favorite song directly to the event queue</summary>
        [HttpPost("players/{playerId}/favorites/{songId}/queue/{eventId}")]
        public async Task<IActionResult> AddFavoriteToQueue(int playerId, int songId, int eventId)
        {
            var queue = (await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetSongQueueByEventQuery(eventId))).ToList();
            var item = new AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles.KaraokeSongFileQueueItem
            {
                EventId = eventId, SongId = songId, RequestedByPlayerId = playerId,
                Position = queue.Count + 1, Status = AudioVerse.Domain.Enums.SongQueueStatus.Pending
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.AddSongQueueItemCommand(item));
            return CreatedAtAction(nameof(GetSongQueue), new { eventId }, new { Id = id });
        }

        // --------------------------------------------------
        //  SONG IMPORT (2.5)
        // --------------------------------------------------

        // YouTube import moved to KaraokeSongsController

        // ════════════════════════════════════════════════════════════
        //  KARAOKE SONG PICKS — sign up to sing
        // ════════════════════════════════════════════════════════════

        /// <summary>Add a song to the karaoke session pick list (ad-hoc)</summary>
        [HttpPost("sessions/{sessionId:int}/song-picks")]
        public async Task<IActionResult> AddKaraokeSongPick(int sessionId, [FromBody] Models.Requests.Karaoke.AddKaraokeSongPickRequest req)
        {
            var pick = new KaraokeSessionSongPick
            {
                SessionId = sessionId,
                SongId = req.SongId,
                SongTitle = req.SongTitle
            };
            var id = await _mediator.Send(new AddKaraokeSongPickCommand(pick));
            return CreatedAtAction(nameof(GetKaraokeSongPicks), new { sessionId }, new { id });
        }

        /// <summary>Import all songs from a KaraokePlaylist into the session's pick list</summary>
        [HttpPost("sessions/{sessionId:int}/song-picks/import")]
        public async Task<IActionResult> ImportKaraokeSongPicks(int sessionId, [FromQuery] int playlistId)
        {
            var count = await _mediator.Send(new ImportKaraokeSongPicksCommand(sessionId, playlistId));
            return Ok(new { imported = count });
        }

        /// <summary>Get all song picks with signups (sorted by popularity)</summary>
        [HttpGet("sessions/{sessionId:int}/song-picks")]
        public async Task<IActionResult> GetKaraokeSongPicks(int sessionId)
        {
            var picks = await _mediator.Send(new GetKaraokeSongPicksBySessionQuery(sessionId));
            return Ok(picks);
        }

        /// <summary>Get ranked song picks — most signups first. maxRounds marks which songs "make the cut".</summary>
        [HttpGet("sessions/{sessionId:int}/song-picks/ranked")]
        public async Task<IActionResult> GetKaraokeSongPicksRanked(int sessionId, [FromQuery] int? maxRounds)
        {
            var ranking = await _mediator.Send(new GetKaraokeSongPicksRankedQuery(sessionId, maxRounds));
            return Ok(ranking);
        }

        /// <summary>Delete a song pick</summary>
        [HttpDelete("song-picks/{pickId:int}")]
        public async Task<IActionResult> DeleteKaraokeSongPick(int pickId)
        {
            return await _mediator.Send(new DeleteKaraokeSongPickCommand(pickId))
                ? NoContent() : NotFound();
        }

        /// <summary>Sign up to sing a song (upsert)</summary>
        [HttpPost("song-picks/{pickId:int}/signup")]
        public async Task<IActionResult> SignupKaraokeSong(int pickId, [FromBody] Models.Requests.Karaoke.KaraokeSongSignupRequest req)
        {
            var signup = new KaraokeSessionSongSignup { PickId = pickId, PlayerId = req.PlayerId, PreferredSlot = req.PreferredSlot };
            var id = await _mediator.Send(new UpsertKaraokeSongSignupCommand(signup));
            return Ok(new { id });
        }

        /// <summary>Remove your song signup</summary>
        [HttpDelete("song-picks/{pickId:int}/signup/{playerId:int}")]
        public async Task<IActionResult> DeleteKaraokeSongSignup(int pickId, int playerId)
        {
            return await _mediator.Send(new DeleteKaraokeSongSignupCommand(pickId, playerId))
                ? NoContent() : NotFound();
        }

        private static AudioVerse.Application.Models.UserProfilePlayerDto? MapPlayerDto(
            AudioVerse.Domain.Entities.UserProfiles.UserProfilePlayer? player)
        {
            if (player is null) return null;
            return new AudioVerse.Application.Models.UserProfilePlayerDto
            {
                Id = player.Id,
                Name = player.Name,
                ProfileId = player.ProfileId,
                PreferredColors = player.PreferredColors,
                FillPattern = player.FillPattern,
                IsPrimary = player.IsPrimary,
                Email = player.Email,
                Icon = player.Icon,
                KaraokeSettings = player.KaraokeSettings
            };
        }
    }
}

