using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Games;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for board games, video games, mini-game sessions, and the AvGame catalog.
/// </summary>
public interface IGameRepository
{
    // ????????????????????????????????????????????????????????????
    //  BOARD GAMES
    // ????????????????????????????????????????????????????????????

    /// Searches board games with paging.
    Task<(IEnumerable<BoardGame> Items, int TotalCount)> GetBoardGamesPagedAsync(
        string? query, int? minPlayers, int? maxPlayers,
        int page, int pageSize, string? sortBy, bool descending);

    /// <summary>
    /// Adds a new board game to the catalog.
    /// </summary>
    Task<int> AddBoardGameAsync(BoardGame game);

    /// <summary>
    /// Gets a board game by ID.
    /// </summary>
    Task<BoardGame?> GetBoardGameByIdAsync(int id);

    /// <summary>
    /// Gets a board game by BoardGameGeek ID.
    /// </summary>
    Task<BoardGame?> GetBoardGameByBggIdAsync(int bggId);

    /// <summary>
    /// Gets all board games in the catalog.
    /// </summary>
    Task<IEnumerable<BoardGame>> GetAllBoardGamesAsync();

    /// <summary>
    /// Searches board games by name.
    /// </summary>
    Task<IEnumerable<BoardGame>> SearchBoardGamesAsync(string query, int limit = 20);

    /// <summary>
    /// Updates a board game.
    /// </summary>
    Task<bool> UpdateBoardGameAsync(BoardGame game);

    /// <summary>
    /// Deletes a board game.
    /// </summary>
    Task<bool> DeleteBoardGameAsync(int id);

    /// <summary>
    /// Gets board games by player count range.
    /// </summary>
    Task<IEnumerable<BoardGame>> GetBoardGamesByPlayerCountAsync(int playerCount);

    // ── BGG Sync ──

    /// <summary>Gets the current BGG sync status (singleton row).</summary>
    Task<BggSyncStatus> GetBggSyncStatusAsync();

    /// <summary>Updates the BGG sync status.</summary>
    Task UpdateBggSyncStatusAsync(BggSyncStatus status);

    /// <summary>Bulk upsert board games from BGG (insert or update by BggId).</summary>
    Task<int> UpsertBoardGamesFromBggAsync(IEnumerable<BoardGame> games);

    /// <summary>Gets all board games that have a BggId (for export).</summary>
    Task<List<BoardGame>> GetAllBggBoardGamesAsync();

    /// <summary>Gets the count of board games with BggId.</summary>
    Task<int> GetBggBoardGameCountAsync();

    // ????????????????????????????????????????????????????????????
    //  VIDEO GAMES (Steam/Console)
    // ????????????????????????????????????????????????????????????

    /// Searches video games with paging.
    Task<(IEnumerable<VideoGame> Items, int TotalCount)> GetVideoGamesPagedAsync(
        string? query, int? minPlayers, int? maxPlayers,
        int page, int pageSize, string? sortBy, bool descending);

    /// <summary>
    /// Adds a new video game to the catalog.
    /// </summary>
    Task<int> AddVideoGameAsync(VideoGame game);

    /// <summary>
    /// Gets a video game by ID.
    /// </summary>
    Task<VideoGame?> GetVideoGameByIdAsync(int id);

    /// <summary>
    /// Gets a video game by Steam App ID.
    /// </summary>
    Task<VideoGame?> GetVideoGameBySteamIdAsync(int steamAppId);

    /// <summary>
    /// Gets all video games in the catalog.
    /// </summary>
    Task<IEnumerable<VideoGame>> GetAllVideoGamesAsync();

    /// <summary>
    /// Searches video games by name.
    /// </summary>
    Task<IEnumerable<VideoGame>> SearchVideoGamesAsync(string query, int limit = 20);

    /// <summary>
    /// Updates a video game.
    /// </summary>
    Task<bool> UpdateVideoGameAsync(VideoGame game);

    /// <summary>
    /// Deletes a video game.
    /// </summary>
    Task<bool> DeleteVideoGameAsync(int id);

    /// <summary>
    /// Gets video games that support local multiplayer.
    /// </summary>
    Task<IEnumerable<VideoGame>> GetLocalMultiplayerGamesAsync();

    // ????????????????????????????????????????????????????????????
    //  EVENT GAMES
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Assigns a board game to an event.
    /// </summary>
    Task<int> AddEventBoardGameAsync(EventBoardGameSession assignment);

    /// <summary>
    /// Gets board games assigned to an event.
    /// </summary>
    Task<IEnumerable<EventBoardGameSession>> GetEventBoardGamesAsync(int eventId);

    /// <summary>
    /// Removes a board game assignment from an event.
    /// </summary>
    Task<bool> RemoveEventBoardGameAsync(int id);

    /// <summary>
    /// Assigns a video game to an event.
    /// </summary>
    Task<int> AddEventVideoGameAsync(EventVideoGameSession assignment);

    /// <summary>
    /// Gets video games assigned to an event.
    /// </summary>
    Task<IEnumerable<EventVideoGameSession>> GetEventVideoGamesAsync(int eventId);

    /// <summary>
    /// Removes a video game assignment from an event.
    /// </summary>
    Task<bool> RemoveEventVideoGameAsync(int id);

    // ────────────────────────────────────────────────────────────
    //  BOARD GAME SESSIONS
    // ────────────────────────────────────────────────────────────

    Task<int> AddBoardGameSessionAsync(BoardGameSession session);
    Task<BoardGameSession?> GetBoardGameSessionByIdAsync(int id);
    Task<IEnumerable<BoardGameSession>> GetBoardGameSessionsByEventAsync(int eventId);
    Task<bool> DeleteBoardGameSessionAsync(int id);

    Task<int> AddBoardGameSessionRoundAsync(BoardGameSessionRound round);
    Task<IEnumerable<BoardGameSessionRound>> GetBoardGameSessionRoundsAsync(int sessionId);
    Task<bool> DeleteBoardGameSessionRoundAsync(int id);

    Task<int> AddBoardGameSessionRoundPartAsync(BoardGameSessionRoundPart part);
    Task<bool> DeleteBoardGameSessionRoundPartAsync(int id);

    Task<int> AddBoardGameSessionRoundPartPlayerAsync(BoardGameSessionRoundPartPlayer player);
    Task<bool> UpdateBoardGameSessionRoundPartPlayerScoreAsync(int id, int score);
    Task<bool> DeleteBoardGameSessionRoundPartPlayerAsync(int id);

    // ── Board Game Stats ──
    Task<IEnumerable<BoardGameSessionRoundPartPlayer>> GetPartPlayersByPlayerAsync(int playerId, CancellationToken ct = default);
    Task<IEnumerable<BoardGameSession>> GetSessionsByPlayerAsync(int playerId, CancellationToken ct = default);
    Task<IEnumerable<BoardGameSession>> GetSessionsByBoardGameAsync(int boardGameId, CancellationToken ct = default);
    Task<EventBoardGameSession?> GetEventBoardGameByEventAsync(int eventId, CancellationToken ct = default);

    // ────────────────────────────────────────────────────────────
    //  BOARD GAME COLLECTIONS
    // ────────────────────────────────────────────────────────────

    Task<int> AddBoardGameCollectionAsync(BoardGameCollection collection);
    Task<BoardGameCollection?> GetBoardGameCollectionByIdAsync(int id, bool includeChildren = false, int maxDepth = 1);
    Task<IEnumerable<BoardGameCollection>> GetBoardGameCollectionsByOwnerAsync(int ownerId);
    Task<bool> UpdateBoardGameCollectionAsync(BoardGameCollection collection);
    Task<bool> DeleteBoardGameCollectionAsync(int id);

    Task<int> AddBoardGameToCollectionAsync(BoardGameCollectionBoardGame item);
    Task<bool> RemoveBoardGameFromCollectionAsync(int id);

    // ────────────────────────────────────────────────────────────
    //  VIDEO GAME SESSIONS
    // ────────────────────────────────────────────────────────────

    Task<int> AddVideoGameSessionAsync(VideoGameSession session);
    Task<VideoGameSession?> GetVideoGameSessionByIdAsync(int id);
    Task<IEnumerable<VideoGameSession>> GetVideoGameSessionsByEventAsync(int eventId);
    Task<bool> DeleteVideoGameSessionAsync(int id);

    Task<int> AddVideoGameSessionPlayerAsync(VideoGameSessionPlayer player);
    Task<bool> UpdateVideoGameSessionPlayerScoreAsync(int id, int score);
    Task<bool> DeleteVideoGameSessionPlayerAsync(int id);

    Task<int> AddVideoGameSessionRoundAsync(VideoGameSessionRound round);
    Task<IEnumerable<VideoGameSessionRound>> GetVideoGameSessionRoundsAsync(int sessionId);
    Task<bool> DeleteVideoGameSessionRoundAsync(int id);

    Task<int> AddVideoGameSessionRoundPartAsync(VideoGameSessionRoundPart part);
    Task<bool> DeleteVideoGameSessionRoundPartAsync(int id);

    Task<int> AddVideoGameSessionRoundPartPlayerAsync(VideoGameSessionRoundPartPlayer player);
    Task<bool> UpdateVideoGameSessionRoundPartPlayerScoreAsync(int id, int score);
    Task<bool> DeleteVideoGameSessionRoundPartPlayerAsync(int id);

    // ────────────────────────────────────────────────────────────
    //  VIDEO GAME COLLECTIONS
    // ────────────────────────────────────────────────────────────

    Task<int> AddVideoGameCollectionAsync(VideoGameCollection collection);
    Task<VideoGameCollection?> GetVideoGameCollectionByIdAsync(int id, bool includeChildren = false, int maxDepth = 1);
    Task<IEnumerable<VideoGameCollection>> GetVideoGameCollectionsByOwnerAsync(int ownerId);
    Task<bool> UpdateVideoGameCollectionAsync(VideoGameCollection collection);
    Task<bool> DeleteVideoGameCollectionAsync(int id);

    Task<int> AddVideoGameToCollectionAsync(VideoGameCollectionVideoGame item);
    Task<bool> RemoveVideoGameFromCollectionAsync(int id);

    // ────────────────────────────────────────────────────────────
    //  MINI-GAME SESSIONS
    // ────────────────────────────────────────────────────────────

    /// <summary>Create a mini-game session.</summary>
    Task<int> AddMiniGameSessionAsync(MiniGameSession session);

    /// <summary>Get a mini-game session by ID with rounds and players.</summary>
    Task<MiniGameSession?> GetMiniGameSessionByIdAsync(int id, bool includeRounds = true);

    /// <summary>End a mini-game session (set EndedAtUtc).</summary>
    Task<bool> EndMiniGameSessionAsync(int sessionId);

    /// <summary>Add a round to a session.</summary>
    Task<int> AddMiniGameRoundAsync(MiniGameRound round);

    /// <summary>Get the current round count for a session.</summary>
    Task<int> GetMiniGameRoundCountAsync(int sessionId);

    /// <summary>Add a player result to a round.</summary>
    Task AddMiniGameRoundPlayerAsync(MiniGameRoundPlayer player);

    /// <summary>Get a player's result in a specific round.</summary>
    Task<MiniGameRoundPlayer?> GetMiniGameRoundPlayerAsync(int roundId, int playerId);

    /// <summary>Bulk-add player results to a round.</summary>
    Task AddMiniGameRoundPlayersAsync(IEnumerable<MiniGameRoundPlayer> players);

    /// <summary>Get existing best scores for players in a specific game+mode.</summary>
    Task<Dictionary<int, int>> GetMiniGameBestScoresAsync(string game, string mode, IEnumerable<int> playerIds);

    /// <summary>Get leaderboard for a game (and optionally mode).</summary>
    Task<List<(int PlayerId, string PlayerName, int BestScore, int TotalGames, DateTime AchievedAtUtc)>>
        GetMiniGameLeaderboardAsync(string game, string? mode, int top);

    /// <summary>Get a player's stats across all mini-games.</summary>
    Task<List<(string Game, string Mode, int BestScore, int TotalGames, int TotalXpEarned, DateTime LastPlayedAtUtc)>>
        GetPlayerMiniGameStatsAsync(int playerId);

    // ────────────────────────────────────────────────────────────
    //  AV GAME CATALOG
    // ────────────────────────────────────────────────────────────

    /// <summary>Get an AvGame by ID with modes and achievements.</summary>
    Task<AvGame?> GetAvGameByIdAsync(int id);

    /// <summary>Get an AvGame by its unique code.</summary>
    Task<AvGame?> GetAvGameByCodeAsync(string code);

    /// <summary>Get all enabled games.</summary>
    Task<IEnumerable<AvGame>> GetAllAvGamesAsync(bool includeDisabled = false);

    /// <summary>Add a new game to the catalog.</summary>
    Task<int> AddAvGameAsync(AvGame game);

    /// <summary>Update an existing game.</summary>
    Task<bool> UpdateAvGameAsync(AvGame game);

    /// <summary>Get game configuration (admin).</summary>
    Task<AvGameConfiguration?> GetAvGameConfigurationAsync(int gameId);

    /// <summary>Upsert game configuration.</summary>
    Task UpsertAvGameConfigurationAsync(AvGameConfiguration config);

    /// <summary>Get player settings for a game.</summary>
    Task<AvGameSettings?> GetAvGameSettingsAsync(int gameId, int playerId);

    /// <summary>Upsert player settings for a game.</summary>
    Task UpsertAvGameSettingsAsync(AvGameSettings settings);

    /// <summary>Get player saves for a game.</summary>
    Task<IEnumerable<AvGameSave>> GetAvGameSavesAsync(int gameId, int playerId);

    /// <summary>Add or update a save slot.</summary>
    Task UpsertAvGameSaveAsync(AvGameSave save);

    /// <summary>Delete a save slot.</summary>
    Task<bool> DeleteAvGameSaveAsync(int saveId);

    /// <summary>Get assets for a game.</summary>
    Task<IEnumerable<AvGameAsset>> GetAvGameAssetsAsync(int gameId);

    /// <summary>Add an asset to a game.</summary>
    Task<int> AddAvGameAssetAsync(AvGameAsset asset);

    /// <summary>Delete an asset.</summary>
    Task<bool> DeleteAvGameAssetAsync(int assetId);
}
