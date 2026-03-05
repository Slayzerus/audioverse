using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Domain.Repositories;

/// <summary>Repository for karaoke session song picks and signups (EF-only).</summary>
public interface IKaraokeSongPickRepository
{
    Task<int> AddKaraokeSongPickAsync(KaraokeSessionSongPick pick);
    Task<int> ImportKaraokeSongPicksFromPlaylistAsync(int sessionId, int playlistId);
    Task<IEnumerable<KaraokeSessionSongPick>> GetKaraokeSongPicksBySessionAsync(int sessionId);
    Task<bool> DeleteKaraokeSongPickAsync(int id);
    Task<int> UpsertKaraokeSongSignupAsync(KaraokeSessionSongSignup signup);
    Task<bool> DeleteKaraokeSongSignupAsync(int pickId, int playerId);
}
