using AudioVerse.Application.Models.Audio;
using AudioVerse.Application.Models.SongInformations;

namespace AudioVerse.Application.Services.SongInformations;

public interface ISongInformationService
{
    Task<SongInformation> GetSongDetailsAsync(string songTitle, string artist, CancellationToken ct = default);
    Task<SearchSongLinksResponse> SearchSongLinksAsync(SearchSongLinksRequest request, CancellationToken ct = default);

    // MusicBrainz integration
    Task<List<ExternalTrackResult>> SearchMusicBrainzAsync(string query, string type = "recording", int limit = 25, CancellationToken ct = default);
    Task<MusicBrainzRecording?> GetMusicBrainzRecordingAsync(string mbid, CancellationToken ct = default);
    Task<MusicBrainzArtist?> GetMusicBrainzArtistAsync(string mbid, CancellationToken ct = default);
    Task<MusicBrainzRelease?> GetMusicBrainzReleaseAsync(string mbid, CancellationToken ct = default);
    Task<List<ExternalTrackResult>> LookupByISRCAsync(string isrc, CancellationToken ct = default);
}
