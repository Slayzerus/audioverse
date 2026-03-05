using AudioVerse.Application.Models.Audio;
using AudioVerse.Application.Services.Platforms;
using AudioVerse.Application.Services.Platforms.Spotify;
using AudioVerse.Application.Services.Platforms.Tidal;
using AudioVerse.Application.Services.SongInformations;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers;

/// <summary>
/// External music platform integrations: Spotify, Tidal, YouTube, MusicBrainz.
/// Search and import tracks from external streaming services.
/// </summary>
[ApiController]
[Route("api/library/external")]
[Authorize]
[Produces("application/json")]
[Tags("Library - External Search")]
public class ExternalSearchController : ControllerBase
{
    private readonly ILibrarySongRepository _songRepo;
    private readonly ISpotifyService? _spotify;
    private readonly ITidalService? _tidal;
    private readonly IYouTubeSearchService? _youtube;
    private readonly ISongInformationService? _songInfo;

    public ExternalSearchController(
        ILibrarySongRepository songRepo,
        ISpotifyService? spotify = null,
        ITidalService? tidal = null,
        IYouTubeSearchService? youtube = null,
        ISongInformationService? songInfo = null)
    {
        _songRepo = songRepo;
        _spotify = spotify;
        _tidal = tidal;
        _youtube = youtube;
        _songInfo = songInfo;
    }

    // ------------------------------------------------------------
    //  SPOTIFY
    // ------------------------------------------------------------

    /// <summary>
    /// Search tracks on Spotify.
    /// </summary>
    /// <param name="q">Search query</param>
    /// <param name="limit">Maximum results (default 20)</param>
    /// <returns>List of Spotify tracks</returns>
    /// <summary>Search Spotify.</summary>
    [HttpGet("spotify/search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SearchSpotify([FromQuery] string q, [FromQuery] int limit = 20)
    {
        if (_spotify == null) return BadRequest(new { Message = "Spotify not configured" });
        var searchResult = await _spotify.SearchAsync(q, types: "track", limit: limit);
        return Ok(searchResult.Tracks?.Items ?? []);
    }

    /// <summary>
    /// Get a track from Spotify by ID.
    /// </summary>
    /// <param name="trackId">Spotify track ID</param>
    /// <returns>Track details</returns>
    [HttpGet("spotify/track/{trackId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSpotifyTrack(string trackId)
    {
        if (_spotify == null) return BadRequest(new { Message = "Spotify not configured" });
        var result = await _spotify.GetTrackAsync(trackId);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>
    /// Get an artist from Spotify by ID.
    /// </summary>
    /// <param name="artistId">Spotify artist ID</param>
    /// <returns>Artist details</returns>
    [HttpGet("spotify/artist/{artistId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSpotifyArtist(string artistId)
    {
        if (_spotify == null) return BadRequest(new { Message = "Spotify not configured" });
        var result = await _spotify.GetArtistAsync(artistId);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>
    /// Get an album from Spotify by ID.
    /// </summary>
    /// <param name="albumId">Spotify album ID</param>
    /// <returns>Album details with tracks</returns>
    [HttpGet("spotify/album/{albumId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSpotifyAlbum(string albumId)
    {
        if (_spotify == null) return BadRequest(new { Message = "Spotify not configured" });
        var result = await _spotify.GetAlbumAsync(albumId);
        return result != null ? Ok(result) : NotFound();
    }

    // ------------------------------------------------------------
    //  YOUTUBE
    // ------------------------------------------------------------

    /// <summary>
    /// Search videos on YouTube.
    /// </summary>
    /// <param name="q">Search query</param>
    /// <param name="limit">Maximum results (default 10)</param>
    /// <returns>List of YouTube search results</returns>
    /// <summary>Search You Tube.</summary>
    [HttpGet("youtube/search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SearchYouTube([FromQuery] string q, [FromQuery] int limit = 10)
    {
        if (_youtube == null) return BadRequest(new { Message = "YouTube not configured" });
        var results = await _youtube.SearchAsync(q, limit);
        return Ok(results);
    }

    // ------------------------------------------------------------
    //  TIDAL
    // ------------------------------------------------------------

    /// <summary>
    /// Search tracks on Tidal.
    /// </summary>
    /// <param name="q">Search query</param>
    /// <param name="limit">Maximum results (default 20)</param>
    /// <returns>List of Tidal tracks</returns>
    /// <summary>Search Tidal.</summary>
    [HttpGet("tidal/search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SearchTidal([FromQuery] string q, [FromQuery] int limit = 20)
    {
        if (_tidal == null) return BadRequest(new { Message = "Tidal not configured" });
        var searchResult = await _tidal.SearchAsync(q, limit);
        return Ok(searchResult.Tracks?.Items ?? []);
    }

    /// <summary>
    /// Get a track from Tidal by ID.
    /// </summary>
    /// <param name="trackId">Tidal track ID</param>
    /// <returns>Track details</returns>
    [HttpGet("tidal/track/{trackId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTidalTrack(string trackId)
    {
        if (_tidal == null) return BadRequest(new { Message = "Tidal not configured" });
        var result = await _tidal.GetTrackAsync(trackId);
        return result != null ? Ok(result) : NotFound();
    }

    // ------------------------------------------------------------
    //  MUSICBRAINZ
    // ------------------------------------------------------------

    /// <summary>
    /// Search recordings, artists, or releases on MusicBrainz.
    /// </summary>
    /// <param name="q">Search query</param>
    /// <param name="type">Entity type: recording, artist, release (default: recording)</param>
    /// <param name="limit">Maximum results (default 25)</param>
    /// <returns>List of MusicBrainz results</returns>
    /// <summary>Search Music Brainz.</summary>
    [HttpGet("musicbrainz/search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SearchMusicBrainz([FromQuery] string q, [FromQuery] string type = "recording", [FromQuery] int limit = 25)
    {
        if (_songInfo == null) return BadRequest(new { Message = "MusicBrainz not configured" });
        var results = await _songInfo.SearchMusicBrainzAsync(q, type, limit);
        return Ok(results);
    }

    /// <summary>
    /// Get a recording from MusicBrainz by MBID.
    /// </summary>
    /// <param name="mbid">MusicBrainz recording ID</param>
    /// <returns>Recording details</returns>
    [HttpGet("musicbrainz/recording/{mbid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMusicBrainzRecording(string mbid)
    {
        if (_songInfo == null) return BadRequest(new { Message = "MusicBrainz not configured" });
        var result = await _songInfo.GetMusicBrainzRecordingAsync(mbid);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>
    /// Get an artist from MusicBrainz by MBID.
    /// </summary>
    /// <param name="mbid">MusicBrainz artist ID</param>
    /// <returns>Artist details</returns>
    [HttpGet("musicbrainz/artist/{mbid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMusicBrainzArtist(string mbid)
    {
        if (_songInfo == null) return BadRequest(new { Message = "MusicBrainz not configured" });
        var result = await _songInfo.GetMusicBrainzArtistAsync(mbid);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>
    /// Get a release (album) from MusicBrainz by MBID.
    /// </summary>
    /// <param name="mbid">MusicBrainz release ID</param>
    /// <returns>Release details</returns>
    [HttpGet("musicbrainz/release/{mbid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMusicBrainzRelease(string mbid)
    {
        if (_songInfo == null) return BadRequest(new { Message = "MusicBrainz not configured" });
        var result = await _songInfo.GetMusicBrainzReleaseAsync(mbid);
        return result != null ? Ok(result) : NotFound();
    }

    /// <summary>
    /// Lookup recordings by ISRC code.
    /// </summary>
    /// <param name="isrc">International Standard Recording Code</param>
    /// <returns>List of matching recordings</returns>
    [HttpGet("musicbrainz/isrc/{isrc}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LookupByISRC(string isrc)
    {
        if (_songInfo == null) return BadRequest(new { Message = "MusicBrainz not configured" });
        var results = await _songInfo.LookupByISRCAsync(isrc);
        return Ok(results);
    }

    // ------------------------------------------------------------
    //  UNIFIED SEARCH (all platforms)
    // ------------------------------------------------------------

    /// <summary>
    /// Search across all configured platforms or a specific one.
    /// </summary>
    /// <param name="q">Search query</param>
    /// <param name="source">Optional: spotify, tidal, youtube, musicbrainz (searches all if omitted)</param>
    /// <param name="limit">Maximum results per platform (default 20)</param>
    /// <returns>Combined list of ExternalTrackResult</returns>
    /// <summary>Unified Search.</summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<ExternalTrackResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UnifiedSearch([FromQuery] string q, [FromQuery] string? source = null, [FromQuery] int limit = 20)
    {
        var results = new List<ExternalTrackResult>();

        // If source specified, search only that platform
        if (!string.IsNullOrEmpty(source))
        {
            switch (source.ToLowerInvariant())
            {
                case "spotify":
                    if (_spotify != null)
                    {
                        var searchResult = await _spotify.SearchAsync(q, types: "track", limit: limit);
                        var tracks = searchResult.Tracks?.Items ?? [];
                        results.AddRange(tracks.Select(MapSpotifyTrack));
                    }
                    break;
                case "tidal":
                    if (_tidal != null)
                    {
                        var tidalSearchResult = await _tidal.SearchAsync(q, limit);
                        var tidalTracks = tidalSearchResult.Tracks?.Items ?? [];
                        results.AddRange(tidalTracks.Select(MapTidalTrack));
                    }
                    break;
                case "youtube":
                    if (_youtube != null)
                    {
                        var ytResults = await _youtube.SearchAsync(q, limit);
                        results.AddRange(ytResults);
                    }
                    break;
                case "musicbrainz":
                    if (_songInfo != null)
                    {
                        var mbResults = await _songInfo.SearchMusicBrainzAsync(q, "recording", limit);
                        results.AddRange(mbResults);
                    }
                    break;
            }
        }
        else
        {
            // Search all configured platforms in parallel
            var tasks = new List<Task>();

            if (_spotify != null)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var searchResult = await _spotify.SearchAsync(q, types: "track", limit: limit / 4);
                    var tracks = searchResult.Tracks?.Items ?? [];
                    lock (results) { results.AddRange(tracks.Select(MapSpotifyTrack)); }
                }));
            }

            if (_tidal != null)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var searchResult = await _tidal.SearchAsync(q, limit / 4);
                    var tracks = searchResult.Tracks?.Items ?? [];
                    lock (results) { results.AddRange(tracks.Select(MapTidalTrack)); }
                }));
            }

            if (_youtube != null)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var r = await _youtube.SearchAsync(q, limit / 4);
                    lock (results) { results.AddRange(r); }
                }));
            }

            if (_songInfo != null)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var r = await _songInfo.SearchMusicBrainzAsync(q, "recording", limit / 4);
                    lock (results) { results.AddRange(r); }
                }));
            }

            await Task.WhenAll(tasks);
        }

        return Ok(results);
    }

    // ------------------------------------------------------------
    //  IMPORT TO LIBRARY
    // ------------------------------------------------------------

    /// <summary>
    /// Import an external track into the local media library.
    /// Creates artist if not exists, checks for duplicates by ISRC.
    /// </summary>
    /// <param name="track">External track data</param>
    /// <returns>Created song and artist IDs</returns>
    /// <summary>Import Track.</summary>
    [HttpPost("import")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportTrack([FromBody] ExternalTrackResult track)
    {
        if (track == null || string.IsNullOrWhiteSpace(track.Title))
            return BadRequest(new { Message = "Track data required" });

        // Find or create artist
        var artist = await _songRepo.GetOrCreateArtistByNameAsync(track.Artist ?? "Unknown");

        // Check for duplicate by ISRC
        if (!string.IsNullOrEmpty(track.ISRC))
        {
            var existing = await _songRepo.FindByIsrcAsync(track.ISRC);
            if (existing != null)
            {
                return Ok(new { SongId = existing.Id, ArtistId = artist.Id, Duplicate = true });
            }
        }

        // Create song
        var song = new AudioVerse.Domain.Entities.Audio.Song
        {
            Title = track.Title,
            PrimaryArtistId = artist.Id,
            ISRC = track.ISRC
        };
        var songId = await _songRepo.AddAsync(song);

        // Add streaming link as detail
        var linkData = new
        {
            track.Source,
            track.ExternalId,
            track.CoverUrl,
            track.PreviewUrl,
            ImportedAt = DateTime.UtcNow
        };

        await _songRepo.AddDetailAsync(new AudioVerse.Domain.Entities.Audio.SongDetail
        {
            SongId = songId,
            Type = AudioVerse.Domain.Enums.Audio.SongDetailType.StreamingLinks,
            Value = System.Text.Json.JsonSerializer.Serialize(linkData)
        });

        return Ok(new
        {
            SongId = songId,
            ArtistId = artist.Id,
            track.Source,
            track.ExternalId,
            Duplicate = false
        });
    }

    // ========================================
    // Helpers
    // ========================================

    private static ExternalTrackResult MapSpotifyTrack(Application.Models.Platforms.Spotify.Track t) => new()
    {
        Source = "Spotify",
        ExternalId = t.Id,
        Title = t.Name,
        Artist = t.Artists?.FirstOrDefault()?.Name ?? "",
        Album = t.Album?.Name,
        ISRC = t.ExternalIds?.TryGetValue("isrc", out var isrc) == true ? isrc : null,
        CoverUrl = t.Album?.Images?.FirstOrDefault()?.Url,
        PreviewUrl = t.PreviewUrl,
        DurationMs = t.DurationMs
    };

    private static ExternalTrackResult MapTidalTrack(Application.Models.Platforms.Tidal.Track t) => new()
    {
        Source = "Tidal",
        ExternalId = t.Id,
        Title = t.Title,
        Artist = t.Artists?.FirstOrDefault()?.Name ?? "",
        Album = t.Album?.Title,
        ISRC = t.Isrc,
        CoverUrl = t.Album?.Cover?.Url,
        DurationMs = t.DurationMs
    };
}

