using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Models.Dtos;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Karaoke.Controllers
{
    /// <summary>
    /// Karaoke songs — CRUD, filtering, search, collaborators, versions, import.
    /// </summary>
    [ApiController]
    [Route("api/karaoke")]
    [Produces("application/json")]
    [Authorize]
    [Tags("Karaoke - Songs")]
    public class KaraokeSongsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<KaraokeSongsController> _logger;

        public KaraokeSongsController(IMediator mediator, ILogger<KaraokeSongsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>Get a specific song file by ID.</summary>
        [HttpGet("get-song/{id}")]
        public async Task<IActionResult> GetSongById(int id)
        {
            var song = await _mediator.Send(new GetSongByIdQuery(id));
            if (song == null) return NotFound(new { message = "Song not found" });
            var dto = AudioVerse.Application.Models.Dtos.KaraokeSongDto.FromDomain(song);
            return Ok(dto);
        }

        /// <summary>Get top singings for a given song (top 10 by score).</summary>
        [HttpGet("songs/{songId}/top-singings")]
        public async Task<IActionResult> GetTopSingingsForSong(int songId)
        {
            var singings = await _mediator.Send(new GetTopSingingsForSongQuery(songId, 10));
            return Ok(singings);
        }

        /// <summary>Get all karaoke songs (default excludes InDevelopment).</summary>
        [HttpGet("songs")]
        public async Task<IActionResult> GetAllSongs()
        {
            var includeInDev = User.IsInRole("Admin");
            var songs = await _mediator.Send(new GetAllSongsQuery(includeInDev));
            return Ok(songs);
        }

        /// <summary>Get all karaoke songs including those in development (admin/debug).</summary>
        [HttpGet("songs/all")]
        public async Task<IActionResult> GetAllSongsIncludingInDevelopment()
        {
            if (!User.IsInRole("Admin")) return Forbid();
            var songs = await _mediator.Send(new GetAllSongsQuery(true));
            return Ok(songs);
        }

        /// <summary>Set IsVerified flag for a song (admin).</summary>
        [HttpPost("songs/{songId}/set-verified")]
        public async Task<IActionResult> SetSongVerified(int songId, [FromBody] bool isVerified)
        {
            var result = await _mediator.Send(new SetSongVerifiedCommand(songId, isVerified));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Set InDevelopment flag for a song (admin).</summary>
        [HttpPost("songs/{songId}/set-development")]
        public async Task<IActionResult> SetSongInDevelopment(int songId, [FromBody] bool inDevelopment)
        {
            var result = await _mediator.Send(new SetSongInDevelopmentCommand(songId, inDevelopment));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Bulk set IsVerified for multiple songs.</summary>
        [HttpPost("songs/set-verified-bulk")]
        public async Task<IActionResult> SetSongsVerifiedBulk([FromBody] List<int> songIds, [FromQuery] bool isVerified = true)
        {
            var result = await _mediator.Send(new SetSongsVerifiedCommand(songIds, isVerified));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Bulk set InDevelopment for multiple songs.</summary>
        [HttpPost("songs/set-development-bulk")]
        public async Task<IActionResult> SetSongsInDevelopmentBulk([FromBody] List<int> songIds, [FromQuery] bool inDevelopment = true)
        {
            var result = await _mediator.Send(new SetSongsInDevelopmentCommand(songIds, inDevelopment));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Get collaborators for a song.</summary>
        [HttpGet("songs/{songId}/collaborators")]
        public async Task<IActionResult> GetCollaborators(int songId)
            => Ok(await _mediator.Send(new GetCollaboratorsQuery(songId)));

        /// <summary>Add a collaborator to a karaoke song.</summary>
        [HttpPost("songs/{songId}/collaborators")]
        public async Task<IActionResult> AddCollaborator(int songId, [FromBody] CollaboratorAddRequest request)
        {
            var result = await _mediator.Send(new AddCollaboratorCommand(songId, request.UserId, request.Permission));
            return result ? Ok(new { Success = true }) : BadRequest(new { Success = false });
        }

        /// <summary>Remove a collaborator from a karaoke song.</summary>
        [HttpDelete("songs/{songId}/collaborators/{userId}")]
        public async Task<IActionResult> RemoveCollaborator(int songId, int userId)
        {
            var result = await _mediator.Send(new RemoveCollaboratorCommand(songId, userId));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Update a collaborator's permission level.</summary>
        [HttpPut("songs/{songId}/collaborators/{userId}")]
        public async Task<IActionResult> UpdateCollaboratorPermission(int songId, int userId, [FromBody] CollaborationPermission permission)
        {
            var result = await _mediator.Send(new UpdateCollaboratorPermissionCommand(songId, userId, permission));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Get version history of a karaoke song.</summary>
        [HttpGet("songs/{songId}/versions")]
        public async Task<IActionResult> GetSongVersions(int songId)
        {
            if (!User.IsInRole("Admin"))
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!int.TryParse(userIdClaim, out var uid)) return Forbid();
                var song = await _mediator.Send(new GetSongByIdQuery(songId));
                if (song == null) return NotFound();
                if (song.OwnerId != uid)
                {
                    var perm = await _mediator.Send(new GetCollaboratorPermissionQuery(songId, uid));
                    if (perm == null || perm != CollaborationPermission.Manage) return Forbid();
                }
            }
            var hist = await _mediator.Send(new GetSongHistoryQuery(songId));
            return Ok(hist);
        }

        /// <summary>Get a specific version of a karaoke song.</summary>
        [HttpGet("songs/{songId}/versions/{version}")]
        public async Task<IActionResult> GetSongVersion(int songId, int version)
        {
            if (!User.IsInRole("Admin"))
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!int.TryParse(userIdClaim, out var uid)) return Forbid();
                var song = await _mediator.Send(new GetSongByIdQuery(songId));
                if (song == null) return NotFound();
                if (song.OwnerId != uid)
                {
                    var perm = await _mediator.Send(new GetCollaboratorPermissionQuery(songId, uid));
                    if (perm == null || perm != CollaborationPermission.Manage) return Forbid();
                }
            }
            var hist = await _mediator.Send(new GetSongVersionQuery(songId, version));
            return hist != null ? Ok(hist) : NotFound();
        }

        /// <summary>Revert a karaoke song to a specific version.</summary>
        [HttpPost("songs/{songId}/versions/{version}/revert")]
        public async Task<IActionResult> RevertSongVersion(int songId, int version, [FromBody] string? reason)
        {
            if (!User.IsInRole("Admin"))
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (!int.TryParse(userIdClaim, out var uid)) return Forbid();
                var song = await _mediator.Send(new GetSongByIdQuery(songId));
                if (song == null) return NotFound();
                if (song.OwnerId != uid)
                {
                    var perm = await _mediator.Send(new GetCollaboratorPermissionQuery(songId, uid));
                    if (perm == null || perm != CollaborationPermission.Manage) return Forbid();
                }
                var result = await _mediator.Send(new RevertSongVersionCommand(songId, version, uid, reason));
                return result ? Ok(new { Success = true }) : NotFound();
            }
            var res = await _mediator.Send(new RevertSongVersionCommand(songId, version, null, reason));
            return res ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Filter and search songs by multiple criteria.</summary>
        [HttpGet("filter-songs")]
        public async Task<IActionResult> FilterSongs([FromQuery] string? title, [FromQuery] string? artist, [FromQuery] string? genre, [FromQuery] string? language, [FromQuery] int? year)
        {
            var filteredSongs = await _mediator.Send(new FilterSongsQuery(title, artist, genre, language, year));
            return Ok(filteredSongs.Select(KaraokeSongDto.FromDomain));
        }

        /// <summary>Advanced song search with BPM range, year range, format, sorting.</summary>
        [HttpGet("search-songs")]
        public async Task<IActionResult> SearchSongs(
            [FromQuery] string? q, [FromQuery] string? genre, [FromQuery] string? language,
            [FromQuery] decimal? bpmMin, [FromQuery] decimal? bpmMax,
            [FromQuery] int? yearMin, [FromQuery] int? yearMax,
            [FromQuery] string? format, [FromQuery] string? sortBy, [FromQuery] bool desc = false)
        {
            KaraokeFormat? fmt = null;
            if (!string.IsNullOrEmpty(format) && Enum.TryParse<KaraokeFormat>(format, true, out var f)) fmt = f;
            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IKaraokeRepository>();
            var songs = await repo.FilterSongsAdvancedAsync(q, genre, language, bpmMin, bpmMax, yearMin, yearMax, fmt, sortBy, desc);
            return Ok(songs.Select(KaraokeSongDto.FromDomain));
        }

        /// <summary>Filter songs with advanced options (multi-selects, ranges, pagination).</summary>
        [HttpPost("get-filtered-songs")]
        public async Task<IActionResult> GetFilteredSongs([FromBody] AudioVerse.Application.Models.Requests.Karaoke.SongFilterRequest filter)
        {
            if (filter == null) return BadRequest();
            var res = await _mediator.Send(new GetFilteredSongsQuery(filter));
            return Ok(res);
        }

        /// <summary>Generic filtered entities endpoint (for frontend dynamic filters).</summary>
        [HttpPost("filtered/{entityName}")]
        public async Task<IActionResult> GetFilteredEntities(string entityName, [FromBody] AudioVerse.Application.Models.Requests.Karaoke.DynamicFilterRequest filter)
        {
            if (string.IsNullOrEmpty(entityName) || filter == null) return BadRequest();
            var res = await _mediator.Send(new GetFilteredEntitiesQuery(entityName, filter));
            return Ok(res);
        }

        /// <summary>Search for users to add as collaborators (min 3 chars).</summary>
        [HttpGet("users/search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string term)
        {
            if (string.IsNullOrWhiteSpace(term) || term.Length < 3) return BadRequest(new { Success = false, Message = "Search term too short" });
            var users = await _mediator.Send(new AudioVerse.Application.Queries.User.SearchUsersQuery(term));
            return Ok(users.Select(u => new { u.Id, u.UserName, u.Email }));
        }

        /// <summary>Scan a folder for karaoke song files and import them.</summary>
        [HttpPost("scan-folder")]
        public async Task<IActionResult> ScanFolder([FromQuery] string folderPath)
        {
            var songs = await _mediator.Send(new ScanFolderCommand(folderPath));
            return Ok(songs);
        }

        /// <summary>Parse Ultrastar song format file and import as karaoke song.</summary>
        [HttpPost("parse-ultrastar")]
        public async Task<IActionResult> ParseUltrastar([FromBody] ParseUltrastarFileCommand command)
        {
            var song = await _mediator.Send(command);
            return song != null ? Ok(song) : NotFound();
        }

        /// <summary>Get cover image URL for a karaoke song.</summary>
        [HttpGet("cover")]
        public async Task<IActionResult> GetCoverImage([FromQuery] string filePath)
        {
            var coverImage = await _mediator.Send(new GetCoverImageQuery(filePath));
            if (string.IsNullOrEmpty(coverImage)) return NotFound();
            return Ok(new { CoverImagePath = coverImage });
        }

        /// <summary>Get a karaoke playlist with all songs.</summary>
        [HttpGet("playlist/{playlistId}")]
        public async Task<IActionResult> GetPlaylistWithSongs(int playlistId)
        {
            var playlist = await _mediator.Send(new GetPlaylistWithSongsQuery(playlistId));
            return playlist != null ? Ok(playlist) : NotFound();
        }

        /// <summary>Search YouTube for song metadata (oEmbed, no API key).</summary>
        [HttpGet("songs/youtube/search")]
        public async Task<IActionResult> SearchYouTube([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return BadRequest();
            var client = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.ExternalApis.ISongMetadataClient>();
            var result = await client.SearchYouTubeAsync(query);
            return result != null ? Ok(result) : NotFound(new { Message = "No result found" });
        }

        /// <summary>Get YouTube video metadata by video ID.</summary>
        [HttpGet("songs/youtube/{videoId}")]
        public async Task<IActionResult> GetYouTubeVideo(string videoId)
        {
            var client = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.ExternalApis.ISongMetadataClient>();
            var result = await client.GetYouTubeVideoAsync(videoId);
            return result != null ? Ok(result) : NotFound();
        }

        /// <summary>Import song metadata from YouTube into KaraokeSongFile (metadata only, no audio).</summary>
        [HttpPost("songs/import-youtube/{videoId}")]
        public async Task<IActionResult> ImportFromYouTube(string videoId)
        {
            var client = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.ExternalApis.ISongMetadataClient>();
            var meta = await client.GetYouTubeVideoAsync(videoId);
            if (meta == null) return NotFound(new { Message = "Video not found" });

            var song = new KaraokeSongFile
            {
                Title = meta.Title,
                Artist = meta.Artist,
                Genre = meta.Genre ?? "",
                Year = meta.Year ?? "",
                CoverPath = meta.CoverUrl ?? "",
                ExternalSource = "YouTube",
                ExternalId = videoId,
                ExternalCoverUrl = meta.CoverUrl,
                InDevelopment = true,
                Format = KaraokeFormat.Ultrastar
            };

            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IKaraokeRepository>();
            var id = await repo.AddKaraokeSongFileAsync(song);

            var matcher = HttpContext.RequestServices.GetService<AudioVerse.Domain.Services.ISongMatchingService>();
            if (matcher != null)
            {
                try { await matcher.MatchAndLinkAsync(song); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to match imported YouTube song '{Title}'", song.Title); }
            }

            return Ok(new { Id = id, song.Title, song.Artist, song.LinkedSongId, Source = "YouTube", VideoId = videoId });
        }

        /// <summary>
        /// Batch-match all unlinked karaoke songs to the music catalog (Spotify → YouTube fallback).
        /// Skips songs that already have LinkedSongId. Admin only.
        /// </summary>
        [HttpPost("songs/match-all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MatchAllSongs(CancellationToken ct)
        {
            var matcher = HttpContext.RequestServices.GetService<AudioVerse.Domain.Services.ISongMatchingService>();
            if (matcher == null)
                return StatusCode(503, new { Error = "SongMatchingService not configured" });

            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IEfKaraokeRepository>();
            var unlinked = (await repo.FilterSongsAsync(null, null, null, null, null))
                .Where(s => !s.LinkedSongId.HasValue)
                .ToList();

            if (unlinked.Count == 0)
                return Ok(new { Matched = 0, Message = "All songs already linked" });

            await matcher.MatchAndLinkBatchAsync(unlinked, ct);

            var repo2 = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            await repo2.SaveChangesAsync(ct);

            var linked = unlinked.Count(s => s.LinkedSongId.HasValue);
            return Ok(new { Total = unlinked.Count, Matched = linked, Skipped = unlinked.Count - linked });
        }
    }
}
