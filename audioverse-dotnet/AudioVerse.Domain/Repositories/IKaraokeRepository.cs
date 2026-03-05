using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Repository for karaoke operations: songs, events, sessions, rounds, players, teams, queues, and recordings.
    /// </summary>
    public interface IKaraokeRepository
    {
        Task<KaraokeSongFile?> GetSongByIdAsync(int id);
        Task<IEnumerable<Event>> GetAllPartiesAsync();
        Task<IEnumerable<KaraokeSongFile>> FilterSongsAsync(string? title, string? artist, string? genre, string? language, int? year);
        Task<IEnumerable<KaraokeSongFile>> FilterSongsAdvancedAsync(string? search, string? genre, string? language, decimal? bpmMin, decimal? bpmMax, int? yearMin, int? yearMax, AudioVerse.Domain.Enums.KaraokeFormat? format, string? sortBy, bool descending = false);
        Task<int> CreateEventAsync(Event ev);
        Task<bool> UpdateEventAsync(Event ev);
        Task<bool> DeleteEventAsync(int eventId);
        Task<Event?> GetEventByIdAsync(int eventId);

        // Event-centric APIs (migration-friendly)
        Task<bool> AssignPlayerToEventAsync(KaraokeSessionPlayer partyPlayer);
        Task<int> AddInviteToEventAsync(EventInvite invite);
        Task<int> AddSessionToEventAsync(KaraokeSession session);
        Task<IEnumerable<KaraokeSessionPlayer>> GetParticipantsByEventAsync(int eventId);
        Task<IEnumerable<EventInvite>> GetInvitesByEventAsync(int eventId);
        Task<IEnumerable<KaraokeSession>> GetSessionsByEventAsync(int eventId);
        Task<bool> RemoveParticipantFromEventAsync(int eventId, int playerId);
        Task<Event?> GetEventByEventIdAsync(int eventId);
        Task<int> AddRoundAsync(KaraokeSessionRound round);
        Task<int> AddSongToRoundAsync(KaraokeSinging singing);
        Task<int> AddSessionAsync(KaraokeSession session);
        Task<bool> SaveSingingResultsAsync(IEnumerable<KaraokeSinging> results);
        Task<int> AddRoundPartAsync(KaraokeSessionRoundPart part);
        Task<IEnumerable<KaraokeSongFile>> ScanFolderAsync(string folderPath);
        Task<int> AddKaraokeSongFileAsync(KaraokeSongFile song);
        Task<int> AddKaraokeSongFilesAsync(IEnumerable<KaraokeSongFile> songs);
        Task<List<KaraokeSongFile>> GetAllSongsAsync();
        Task<List<KaraokeSongFile>> GetAllSongsIncludingInDevelopmentAsync();

        // Additional helpers
        Task<bool> DeletePlayerAsync(int playerId);
        Task<IEnumerable<UserProfilePlayer>> GetAllPlayersAsync();

        Task<Event?> GetEventWithPlayersAsync(int eventId);
        Task<UserProfilePlayer?> GetUserProfilePlayerByIdAsync(int playerId);
        Task<int> AddRoundPlayerAsync(KaraokeSessionRoundPlayer rp);
        Task<IEnumerable<KaraokeSessionRoundPlayer>> GetRoundPlayersAsync(int roundId);
        Task<IEnumerable<KaraokeSessionRoundPlayer>> GetRoundPlayersByUserAsync(int roundId, int userId);
        Task<bool> DeleteRoundPlayerAsync(int roundId, int playerId);
        Task<bool> UpdateRoundPlayerSlotAsync(int roundId, int assignmentId, int slot);
        Task<bool> UpdateRoundPlayerMicAsync(int roundId, int assignmentId, string? micDeviceId);
        Task<KaraokeSessionRoundPlayer?> GetRoundPlayerByIdAsync(int id);
        Task<KaraokeSessionRoundPlayer?> FindExistingRoundPlayerAsync(int roundId, int playerId, int? slot);
        Task<int> CountRoundPlayersAsync(int roundId);
        Task<KaraokeSessionRound?> GetRoundByIdAsync(int roundId);
        Task<IEnumerable<KaraokeSessionRound>> GetRoundsBySessionIdAsync(int sessionId);
        Task<bool> ReorderSessionRoundsAsync(int sessionId, List<int> roundIds);
        Task<bool> UpdateKaraokePlayerStatusAsync(int eventId, int playerId, KaraokePlayerStatus status);
        Task<bool> RemovePlayerFromEventAsync(int eventId, int playerId);

        Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId);
        Task<int> AddEventInviteAsync(EventInvite invite);
        Task<EventInvite?> GetEventInviteByIdAsync(int id);
        Task<bool> UpdateEventInviteAsync(EventInvite invite);
        Task<bool> CancelEventInviteAsync(int inviteId);
        Task<KaraokeSessionPlayer?> GetKaraokePlayerAsync(int eventId, int playerId);
        Task<bool> UpdateEventPlayerPermissionsAsync(int eventId, int playerId, EventPermission permissions);

        Task<KaraokeSongFile?> ParseUltrastarSong(string filePath);

        Task<KaraokeSongFile?> ParseUltrastarSong(byte[] fileData, string fileName = "uploaded.txt");

        Task<KaraokeSongFile?> ParseUltrastarSong(string[] lines, string filePath);

        Task<IEnumerable<KaraokeSongFile>> GetAvailableSongsForUserAsync(int? userId, bool includeInDevelopment = false);
        Task<int> SaveSongSnapshotAsync(KaraokeSongFileHistory history);
        Task<IEnumerable<KaraokeSongFileHistory>> GetSongHistoryAsync(int songId);
        Task<KaraokeSongFileHistory?> GetSongVersionAsync(int songId, int version);
        Task<bool> RevertSongToVersionAsync(int songId, int version, int? changedByUserId = null, string? reason = null);
        Task<IEnumerable<int>> GetCollaboratorUserIdsAsync(int songId);
        Task<bool> AddCollaboratorAsync(int songId, int userId, AudioVerse.Domain.Enums.CollaborationPermission permission);
        Task<bool> RemoveCollaboratorAsync(int songId, int userId);
        Task<bool> UpdateCollaboratorPermissionAsync(int songId, int userId, AudioVerse.Domain.Enums.CollaborationPermission permission);
        Task<AudioVerse.Domain.Enums.CollaborationPermission?> GetCollaboratorPermissionAsync(int songId, int userId);
        Task<Event?> GetEventStatusAsync(int eventId);

        // Teams
        Task<int> CreateTeamAsync(KaraokeTeam team);
        Task<KaraokeTeam?> GetTeamByIdAsync(int teamId);
        Task<IEnumerable<KaraokeTeam>> GetTeamsByEventAsync(int eventId);
        Task<bool> UpdateTeamAsync(KaraokeTeam team);
        Task<bool> DeleteTeamAsync(int teamId);
        Task<int> AddTeamPlayerAsync(KaraokeTeamPlayer tp);
        Task<bool> RemoveTeamPlayerAsync(int teamId, int playerId);
        Task<IEnumerable<KaraokeTeamPlayer>> GetTeamPlayersAsync(int teamId);

        // Song Queue
        Task<int> AddSongQueueItemAsync(KaraokeSongFileQueueItem item);
        Task<IEnumerable<KaraokeSongFileQueueItem>> GetSongQueueByEventAsync(int eventId);
        Task<bool> UpdateSongQueueItemStatusAsync(int id, AudioVerse.Domain.Enums.SongQueueStatus status);
        Task<bool> RemoveSongQueueItemAsync(int id);

        // Favorites
        Task<int> AddFavoriteSongAsync(AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong fav);
        Task<bool> RemoveFavoriteSongAsync(int playerId, int songId);
        Task<IEnumerable<AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong>> GetFavoriteSongsAsync(int playerId);

        // Song CRUD
        Task<bool> UpdateSongAsync(KaraokeSongFile song);
        Task<bool> DeleteSongAsync(int songId);
        Task<bool> SetSongVerifiedAsync(int songId, bool isVerified);
        Task<bool> SetSongInDevelopmentAsync(int songId, bool inDevelopment);
        Task<bool> SetSongsVerifiedAsync(IEnumerable<int> songIds, bool isVerified);
        Task<bool> SetSongsInDevelopmentAsync(IEnumerable<int> songIds, bool inDevelopment);

        // Stats (returns raw singing data for application-layer projection)
        Task<IEnumerable<KaraokeSinging>> GetRankingSingingsAsync(int top, CancellationToken ct = default);
        Task<IEnumerable<KaraokeSinging>> GetHistorySingingsAsync(int userId, int take, CancellationToken ct = default);
        Task<IEnumerable<KaraokeSinging>> GetActivitySingingsAsync(int days, CancellationToken ct = default);
        Task<IEnumerable<KaraokeSinging>> GetTopSingingsForSongAsync(int songId, int take, CancellationToken ct = default);

        // ── Queryable access for dynamic filtering ──
        IQueryable<KaraokeSongFile> GetSongsQueryable();
    }
}
