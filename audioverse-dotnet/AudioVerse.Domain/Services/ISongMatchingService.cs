using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Domain.Services;

/// <summary>
/// Automatycznie wyszukuje metadane piosenki w serwisach zewnętrznych (Spotify, YouTube),
/// tworzy/znajduje odpowiadający wpis Song + Artist w katalogu audio
/// i linkuje go z KaraokeSongFile.
/// </summary>
public interface ISongMatchingService
{
    /// <summary>
    /// Dopasowuje KaraokeSongFile do piosenki w katalogu audio.
    /// Szuka w Spotify (preferowane) i YouTube, tworzy Song + Artist jeśli nie istnieją,
    /// zapisuje linki streamingowe i ISRC jako SongDetail.
    /// Ustawia KaraokeSongFile.LinkedSongId.
    /// </summary>
    Task MatchAndLinkAsync(KaraokeSongFile karaokeSong, CancellationToken ct = default);

    /// <summary>
    /// Dopasowuje wiele piosenek (batch). Pomija już zlinkowane.
    /// </summary>
    Task MatchAndLinkBatchAsync(IEnumerable<KaraokeSongFile> karaokeSongs, CancellationToken ct = default);
}
