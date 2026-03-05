using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IGameRepository.
/// Handles board games, video games, mini-game sessions, and the AvGame catalog.
/// </summary>
public class GameRepositoryEF : IGameRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<GameRepositoryEF> _logger;

    public GameRepositoryEF(AudioVerseDbContext dbContext, ILogger<GameRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    // ── BOARD GAMES ──

    public async Task<(IEnumerable<BoardGame> Items, int TotalCount)> GetBoardGamesPagedAsync(
        string? query, int? minPlayers, int? maxPlayers,
        int page, int pageSize, string? sortBy, bool descending)
    {
        var q = _dbContext.BoardGames.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(g => g.Name.Contains(query) || (g.Description != null && g.Description.Contains(query)));
        if (minPlayers.HasValue)
            q = q.Where(g => g.MaxPlayers >= minPlayers.Value);
        if (maxPlayers.HasValue)
            q = q.Where(g => g.MinPlayers <= maxPlayers.Value);

        var total = await q.CountAsync();
        q = (sortBy?.ToLowerInvariant()) switch
        {
            "minplayers" => descending ? q.OrderByDescending(g => g.MinPlayers) : q.OrderBy(g => g.MinPlayers),
            "maxplayers" => descending ? q.OrderByDescending(g => g.MaxPlayers) : q.OrderBy(g => g.MaxPlayers),
            "bggrating" => descending ? q.OrderByDescending(g => g.BggRating) : q.OrderBy(g => g.BggRating),
            _ => descending ? q.OrderByDescending(g => g.Name) : q.OrderBy(g => g.Name),
        };
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    /// <inheritdoc />
    public async Task<int> AddBoardGameAsync(BoardGame game)
    {
        _dbContext.BoardGames.Add(game);
        await _dbContext.SaveChangesAsync();
        return game.Id;
    }

    /// <inheritdoc />
    public async Task<BoardGame?> GetBoardGameByIdAsync(int id)
    {
        return await _dbContext.BoardGames.FindAsync(id);
    }

    /// <inheritdoc />
    public async Task<BoardGame?> GetBoardGameByBggIdAsync(int bggId)
    {
        return await _dbContext.BoardGames
            .FirstOrDefaultAsync(g => g.BggId == bggId);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<BoardGame>> GetAllBoardGamesAsync()
    {
        return await _dbContext.BoardGames
            .OrderBy(g => g.Name)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<BoardGame>> SearchBoardGamesAsync(string query, int limit = 20)
    {
        var lowerQuery = query.ToLower();
        return await _dbContext.BoardGames
            .Where(g => g.Name.ToLower().Contains(lowerQuery))
            .OrderBy(g => g.Name)
            .Take(limit)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdateBoardGameAsync(BoardGame game)
    {
        var existing = await _dbContext.BoardGames.FindAsync(game.Id);
        if (existing == null) return false;

        existing.Name = game.Name;
        existing.Description = game.Description;
        existing.MinPlayers = game.MinPlayers;
        existing.MaxPlayers = game.MaxPlayers;
        existing.EstimatedDurationMinutes = game.EstimatedDurationMinutes;
        existing.Genre = game.Genre;
        existing.ImageKey = game.ImageKey;
        existing.OwnerId = game.OwnerId;
        existing.BggId = game.BggId;
        existing.BggImageUrl = game.BggImageUrl;
        existing.BggRating = game.BggRating;
        existing.BggYearPublished = game.BggYearPublished;
        existing.IsFullBggData = game.IsFullBggData;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteBoardGameAsync(int id)
    {
        var game = await _dbContext.BoardGames.FindAsync(id);
        if (game == null) return false;

        _dbContext.BoardGames.Remove(game);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("Board game {Id} deleted", id);
        return true;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<BoardGame>> GetBoardGamesByPlayerCountAsync(int playerCount)
    {
        return await _dbContext.BoardGames
            .Where(g => g.MinPlayers <= playerCount && g.MaxPlayers >= playerCount)
            .OrderBy(g => g.Name)
            .ToListAsync();
    }

    // ????????????????????????????????????????????????????????????
    //  VIDEO GAMES
    // ── VIDEO GAMES ──

    public async Task<(IEnumerable<VideoGame> Items, int TotalCount)> GetVideoGamesPagedAsync(
        string? query, int? minPlayers, int? maxPlayers,
        int page, int pageSize, string? sortBy, bool descending)
    {
        var q = _dbContext.VideoGames.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(g => g.Name.Contains(query) || (g.Description != null && g.Description.Contains(query)));
        if (minPlayers.HasValue)
            q = q.Where(g => g.MaxPlayers >= minPlayers.Value);
        if (maxPlayers.HasValue)
            q = q.Where(g => g.MinPlayers <= maxPlayers.Value);

        var total = await q.CountAsync();
        q = (sortBy?.ToLowerInvariant()) switch
        {
            "minplayers" => descending ? q.OrderByDescending(g => g.MinPlayers) : q.OrderBy(g => g.MinPlayers),
            "maxplayers" => descending ? q.OrderByDescending(g => g.MaxPlayers) : q.OrderBy(g => g.MaxPlayers),
            "platform" => descending ? q.OrderByDescending(g => g.Platform) : q.OrderBy(g => g.Platform),
            _ => descending ? q.OrderByDescending(g => g.Name) : q.OrderBy(g => g.Name),
        };
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    /// <inheritdoc />
    public async Task<int> AddVideoGameAsync(VideoGame game)
    {
        _dbContext.VideoGames.Add(game);
        await _dbContext.SaveChangesAsync();
        return game.Id;
    }

    /// <inheritdoc />
    public async Task<VideoGame?> GetVideoGameByIdAsync(int id)
    {
        return await _dbContext.VideoGames.FindAsync(id);
    }

    /// <inheritdoc />
    public async Task<VideoGame?> GetVideoGameBySteamIdAsync(int steamAppId)
    {
        return await _dbContext.VideoGames
            .FirstOrDefaultAsync(g => g.SteamAppId == steamAppId);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<VideoGame>> GetAllVideoGamesAsync()
    {
        return await _dbContext.VideoGames
            .OrderBy(g => g.Name)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<VideoGame>> SearchVideoGamesAsync(string query, int limit = 20)
    {
        var lowerQuery = query.ToLower();
        return await _dbContext.VideoGames
            .Where(g => g.Name.ToLower().Contains(lowerQuery))
            .OrderBy(g => g.Name)
            .Take(limit)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdateVideoGameAsync(VideoGame game)
    {
        var existing = await _dbContext.VideoGames.FindAsync(game.Id);
        if (existing == null) return false;

        existing.Name = game.Name;
        existing.Description = game.Description;
        existing.Platform = game.Platform;
        existing.MinPlayers = game.MinPlayers;
        existing.MaxPlayers = game.MaxPlayers;
        existing.Genre = game.Genre;
        existing.ImageKey = game.ImageKey;
        existing.IsLocal = game.IsLocal;
        existing.IsOnline = game.IsOnline;
        existing.SteamAppId = game.SteamAppId;
        existing.SteamHeaderImageUrl = game.SteamHeaderImageUrl;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteVideoGameAsync(int id)
    {
        var game = await _dbContext.VideoGames.FindAsync(id);
        if (game == null) return false;

        _dbContext.VideoGames.Remove(game);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("Video game {Id} deleted", id);
        return true;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<VideoGame>> GetLocalMultiplayerGamesAsync()
    {
        return await _dbContext.VideoGames
            .Where(g => g.IsLocal)
            .OrderBy(g => g.Name)
            .ToListAsync();
    }

    // ????????????????????????????????????????????????????????????
    //  EVENT GAMES
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> AddEventBoardGameAsync(EventBoardGameSession assignment)
    {
        _dbContext.EventBoardGames.Add(assignment);
        await _dbContext.SaveChangesAsync();
        return assignment.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventBoardGameSession>> GetEventBoardGamesAsync(int eventId)
    {
        return await _dbContext.EventBoardGames
            .Where(e => e.EventId == eventId)
            .Include(e => e.BoardGame)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> RemoveEventBoardGameAsync(int id)
    {
        var assignment = await _dbContext.EventBoardGames.FindAsync(id);
        if (assignment == null) return false;

        _dbContext.EventBoardGames.Remove(assignment);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<int> AddEventVideoGameAsync(EventVideoGameSession assignment)
    {
        _dbContext.EventVideoGames.Add(assignment);
        await _dbContext.SaveChangesAsync();
        return assignment.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventVideoGameSession>> GetEventVideoGamesAsync(int eventId)
    {
        return await _dbContext.EventVideoGames
            .Where(e => e.EventId == eventId)
            .Include(e => e.VideoGame)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> RemoveEventVideoGameAsync(int id)
    {
        var assignment = await _dbContext.EventVideoGames.FindAsync(id);
        if (assignment == null) return false;

        _dbContext.EventVideoGames.Remove(assignment);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ────────────────────────────────────────────────────────────
    //  BOARD GAME SESSIONS
    // ────────────────────────────────────────────────────────────

    public async Task<int> AddBoardGameSessionAsync(BoardGameSession session)
    {
        _dbContext.BoardGameSessions.Add(session);
        await _dbContext.SaveChangesAsync();
        return session.Id;
    }

    public async Task<BoardGameSession?> GetBoardGameSessionByIdAsync(int id)
    {
        return await _dbContext.BoardGameSessions
            .Include(s => s.Rounds).ThenInclude(r => r.Parts).ThenInclude(p => p.Players)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<BoardGameSession>> GetBoardGameSessionsByEventAsync(int eventId)
    {
        return await _dbContext.BoardGameSessions
            .Where(s => s.EventId == eventId)
            .Include(s => s.Rounds)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync();
    }

    public async Task<bool> DeleteBoardGameSessionAsync(int id)
    {
        var s = await _dbContext.BoardGameSessions.FindAsync(id);
        if (s == null) return false;
        _dbContext.BoardGameSessions.Remove(s);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddBoardGameSessionRoundAsync(BoardGameSessionRound round)
    {
        _dbContext.BoardGameSessionRounds.Add(round);
        await _dbContext.SaveChangesAsync();
        return round.Id;
    }

    public async Task<IEnumerable<BoardGameSessionRound>> GetBoardGameSessionRoundsAsync(int sessionId)
    {
        return await _dbContext.BoardGameSessionRounds
            .Where(r => r.SessionId == sessionId)
            .Include(r => r.Parts).ThenInclude(p => p.Players)
            .OrderBy(r => r.Number)
            .ToListAsync();
    }

    public async Task<bool> DeleteBoardGameSessionRoundAsync(int id)
    {
        var r = await _dbContext.BoardGameSessionRounds.FindAsync(id);
        if (r == null) return false;
        _dbContext.BoardGameSessionRounds.Remove(r);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddBoardGameSessionRoundPartAsync(BoardGameSessionRoundPart part)
    {
        _dbContext.BoardGameSessionRoundParts.Add(part);
        await _dbContext.SaveChangesAsync();
        return part.Id;
    }

    public async Task<bool> DeleteBoardGameSessionRoundPartAsync(int id)
    {
        var p = await _dbContext.BoardGameSessionRoundParts.FindAsync(id);
        if (p == null) return false;
        _dbContext.BoardGameSessionRoundParts.Remove(p);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddBoardGameSessionRoundPartPlayerAsync(BoardGameSessionRoundPartPlayer player)
    {
        _dbContext.BoardGameSessionRoundPartPlayers.Add(player);
        await _dbContext.SaveChangesAsync();
        return player.Id;
    }

    public async Task<bool> UpdateBoardGameSessionRoundPartPlayerScoreAsync(int id, int score)
    {
        var p = await _dbContext.BoardGameSessionRoundPartPlayers.FindAsync(id);
        if (p == null) return false;
        p.Score = score;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBoardGameSessionRoundPartPlayerAsync(int id)
    {
        var p = await _dbContext.BoardGameSessionRoundPartPlayers.FindAsync(id);
        if (p == null) return false;
        _dbContext.BoardGameSessionRoundPartPlayers.Remove(p);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ────────────────────────────────────────────────────────────
    //  BOARD GAME COLLECTIONS
    // ────────────────────────────────────────────────────────────

    public async Task<int> AddBoardGameCollectionAsync(BoardGameCollection collection)
    {
        _dbContext.BoardGameCollections.Add(collection);
        await _dbContext.SaveChangesAsync();
        return collection.Id;
    }

    public async Task<BoardGameCollection?> GetBoardGameCollectionByIdAsync(int id, bool includeChildren = false, int maxDepth = 1)
    {
        var query = _dbContext.BoardGameCollections
            .Include(c => c.Items).ThenInclude(i => i.BoardGame)
            .AsQueryable();

        if (includeChildren)
            query = query.Include(c => c.Children);

        var collection = await query.FirstOrDefaultAsync(c => c.Id == id);
        if (collection != null && includeChildren && maxDepth > 1)
            await LoadChildrenRecursiveAsync(collection, maxDepth - 1);

        return collection;
    }

    private async Task LoadChildrenRecursiveAsync(BoardGameCollection parent, int remainingDepth)
    {
        if (remainingDepth <= 0) return;
        await _dbContext.Entry(parent).Collection(c => c.Children).Query()
            .Include(c => c.Items).ThenInclude(i => i.BoardGame)
            .Include(c => c.Children)
            .LoadAsync();
        foreach (var child in parent.Children)
            await LoadChildrenRecursiveAsync(child, remainingDepth - 1);
    }

    public async Task<IEnumerable<BoardGameCollection>> GetBoardGameCollectionsByOwnerAsync(int ownerId)
    {
        return await _dbContext.BoardGameCollections
            .Where(c => c.OwnerId == ownerId)
            .Include(c => c.Items)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<bool> UpdateBoardGameCollectionAsync(BoardGameCollection collection)
    {
        var existing = await _dbContext.BoardGameCollections.FindAsync(collection.Id);
        if (existing == null) return false;
        existing.Name = collection.Name;
        existing.IsPublic = collection.IsPublic;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBoardGameCollectionAsync(int id)
    {
        var c = await _dbContext.BoardGameCollections.FindAsync(id);
        if (c == null) return false;
        _dbContext.BoardGameCollections.Remove(c);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddBoardGameToCollectionAsync(BoardGameCollectionBoardGame item)
    {
        _dbContext.BoardGameCollectionBoardGames.Add(item);
        await _dbContext.SaveChangesAsync();
        return item.Id;
    }

    public async Task<bool> RemoveBoardGameFromCollectionAsync(int id)
    {
        var i = await _dbContext.BoardGameCollectionBoardGames.FindAsync(id);
        if (i == null) return false;
        _dbContext.BoardGameCollectionBoardGames.Remove(i);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ────────────────────────────────────────────────────────────
    //  VIDEO GAME SESSIONS
    // ────────────────────────────────────────────────────────────

    public async Task<int> AddVideoGameSessionAsync(VideoGameSession session)
    {
        _dbContext.VideoGameSessions.Add(session);
        await _dbContext.SaveChangesAsync();
        return session.Id;
    }

    public async Task<VideoGameSession?> GetVideoGameSessionByIdAsync(int id)
    {
        return await _dbContext.VideoGameSessions
            .Include(s => s.VideoGame)
            .Include(s => s.Players)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<VideoGameSession>> GetVideoGameSessionsByEventAsync(int eventId)
    {
        return await _dbContext.VideoGameSessions
            .Where(s => s.EventId == eventId)
            .Include(s => s.VideoGame)
            .Include(s => s.Players)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync();
    }

    public async Task<bool> DeleteVideoGameSessionAsync(int id)
    {
        var s = await _dbContext.VideoGameSessions.FindAsync(id);
        if (s == null) return false;
        _dbContext.VideoGameSessions.Remove(s);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddVideoGameSessionPlayerAsync(VideoGameSessionPlayer player)
    {
        _dbContext.VideoGameSessionPlayers.Add(player);
        await _dbContext.SaveChangesAsync();
        return player.Id;
    }

    public async Task<bool> UpdateVideoGameSessionPlayerScoreAsync(int id, int score)
    {
        var p = await _dbContext.VideoGameSessionPlayers.FindAsync(id);
        if (p == null) return false;
        p.Score = score;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteVideoGameSessionPlayerAsync(int id)
    {
        var p = await _dbContext.VideoGameSessionPlayers.FindAsync(id);
        if (p == null) return false;
        _dbContext.VideoGameSessionPlayers.Remove(p);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ── VIDEO GAME SESSION ROUNDS / PARTS / PART-PLAYERS ──

    public async Task<int> AddVideoGameSessionRoundAsync(VideoGameSessionRound round)
    {
        _dbContext.VideoGameSessionRounds.Add(round);
        await _dbContext.SaveChangesAsync();
        return round.Id;
    }

    public async Task<IEnumerable<VideoGameSessionRound>> GetVideoGameSessionRoundsAsync(int sessionId)
    {
        return await _dbContext.VideoGameSessionRounds
            .Where(r => r.SessionId == sessionId)
            .Include(r => r.Parts).ThenInclude(p => p.Players)
            .OrderBy(r => r.Number)
            .ToListAsync();
    }

    public async Task<bool> DeleteVideoGameSessionRoundAsync(int id)
    {
        var r = await _dbContext.VideoGameSessionRounds.FindAsync(id);
        if (r == null) return false;
        _dbContext.VideoGameSessionRounds.Remove(r);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddVideoGameSessionRoundPartAsync(VideoGameSessionRoundPart part)
    {
        _dbContext.VideoGameSessionRoundParts.Add(part);
        await _dbContext.SaveChangesAsync();
        return part.Id;
    }

    public async Task<bool> DeleteVideoGameSessionRoundPartAsync(int id)
    {
        var p = await _dbContext.VideoGameSessionRoundParts.FindAsync(id);
        if (p == null) return false;
        _dbContext.VideoGameSessionRoundParts.Remove(p);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddVideoGameSessionRoundPartPlayerAsync(VideoGameSessionRoundPartPlayer player)
    {
        _dbContext.VideoGameSessionRoundPartPlayers.Add(player);
        await _dbContext.SaveChangesAsync();
        return player.Id;
    }

    public async Task<bool> UpdateVideoGameSessionRoundPartPlayerScoreAsync(int id, int score)
    {
        var p = await _dbContext.VideoGameSessionRoundPartPlayers.FindAsync(id);
        if (p == null) return false;
        p.Score = score;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteVideoGameSessionRoundPartPlayerAsync(int id)
    {
        var p = await _dbContext.VideoGameSessionRoundPartPlayers.FindAsync(id);
        if (p == null) return false;
        _dbContext.VideoGameSessionRoundPartPlayers.Remove(p);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ────────────────────────────────────────────────────────────
    //  VIDEO GAME COLLECTIONS
    // ────────────────────────────────────────────────────────────

    public async Task<int> AddVideoGameCollectionAsync(VideoGameCollection collection)
    {
        _dbContext.VideoGameCollections.Add(collection);
        await _dbContext.SaveChangesAsync();
        return collection.Id;
    }

    public async Task<VideoGameCollection?> GetVideoGameCollectionByIdAsync(int id, bool includeChildren = false, int maxDepth = 1)
    {
        var query = _dbContext.VideoGameCollections
            .Include(c => c.Items).ThenInclude(i => i.VideoGame)
            .AsQueryable();

        if (includeChildren)
            query = query.Include(c => c.Children);

        var collection = await query.FirstOrDefaultAsync(c => c.Id == id);
        if (collection != null && includeChildren && maxDepth > 1)
            await LoadVideoGameChildrenRecursiveAsync(collection, maxDepth - 1);

        return collection;
    }

    private async Task LoadVideoGameChildrenRecursiveAsync(VideoGameCollection parent, int remainingDepth)
    {
        if (remainingDepth <= 0) return;
        await _dbContext.Entry(parent).Collection(c => c.Children).Query()
            .Include(c => c.Items).ThenInclude(i => i.VideoGame)
            .Include(c => c.Children)
            .LoadAsync();
        foreach (var child in parent.Children)
            await LoadVideoGameChildrenRecursiveAsync(child, remainingDepth - 1);
    }

    public async Task<IEnumerable<VideoGameCollection>> GetVideoGameCollectionsByOwnerAsync(int ownerId)
    {
        return await _dbContext.VideoGameCollections
            .Where(c => c.OwnerId == ownerId)
            .Include(c => c.Items)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<bool> UpdateVideoGameCollectionAsync(VideoGameCollection collection)
    {
        var existing = await _dbContext.VideoGameCollections.FindAsync(collection.Id);
        if (existing == null) return false;
        existing.Name = collection.Name;
        existing.IsPublic = collection.IsPublic;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteVideoGameCollectionAsync(int id)
    {
        var c = await _dbContext.VideoGameCollections.FindAsync(id);
        if (c == null) return false;
        _dbContext.VideoGameCollections.Remove(c);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddVideoGameToCollectionAsync(VideoGameCollectionVideoGame item)
    {
        _dbContext.VideoGameCollectionVideoGames.Add(item);
        await _dbContext.SaveChangesAsync();
        return item.Id;
    }

    public async Task<bool> RemoveVideoGameFromCollectionAsync(int id)
    {
        var i = await _dbContext.VideoGameCollectionVideoGames.FindAsync(id);
        if (i == null) return false;
        _dbContext.VideoGameCollectionVideoGames.Remove(i);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ── MINI-GAME SESSIONS ──

    public async Task<int> AddMiniGameSessionAsync(MiniGameSession session)
    {
        _dbContext.MiniGameSessions.Add(session);
        await _dbContext.SaveChangesAsync();
        return session.Id;
    }

    public async Task<MiniGameSession?> GetMiniGameSessionByIdAsync(int id, bool includeRounds = true)
    {
        var query = _dbContext.MiniGameSessions.AsQueryable();
        if (includeRounds)
        {
            query = query
                .Include(s => s.Rounds.OrderBy(r => r.RoundNumber))
                    .ThenInclude(r => r.Players.OrderBy(p => p.Placement))
                        .ThenInclude(p => p.Player)
                .Include(s => s.HostPlayer);
        }
        return await query.FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<bool> EndMiniGameSessionAsync(int sessionId)
    {
        var session = await _dbContext.MiniGameSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null || session.EndedAtUtc != null) return false;
        session.EndedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<int> AddMiniGameRoundAsync(MiniGameRound round)
    {
        _dbContext.MiniGameRounds.Add(round);
        await _dbContext.SaveChangesAsync();
        return round.Id;
    }

    public async Task<int> GetMiniGameRoundCountAsync(int sessionId)
    {
        return await _dbContext.MiniGameRounds.CountAsync(r => r.SessionId == sessionId);
    }

    public async Task AddMiniGameRoundPlayerAsync(MiniGameRoundPlayer player)
    {
        _dbContext.MiniGameRoundPlayers.Add(player);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<MiniGameRoundPlayer?> GetMiniGameRoundPlayerAsync(int roundId, int playerId)
    {
        return await _dbContext.MiniGameRoundPlayers
            .Include(rp => rp.Player)
            .Include(rp => rp.Round)
            .FirstOrDefaultAsync(rp => rp.RoundId == roundId && rp.PlayerId == playerId);
    }

    public async Task AddMiniGameRoundPlayersAsync(IEnumerable<MiniGameRoundPlayer> players)
    {
        _dbContext.MiniGameRoundPlayers.AddRange(players);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<Dictionary<int, int>> GetMiniGameBestScoresAsync(string game, string mode, IEnumerable<int> playerIds)
    {
        var ids = playerIds.ToList();
        return await _dbContext.MiniGameRoundPlayers
            .Include(rp => rp.Round)
            .Where(rp => rp.Round != null
                && rp.Round.Game == game
                && rp.Round.Mode == mode
                && ids.Contains(rp.PlayerId))
            .GroupBy(rp => rp.PlayerId)
            .Select(g => new { PlayerId = g.Key, BestScore = g.Max(rp => rp.Score) })
            .ToDictionaryAsync(x => x.PlayerId, x => x.BestScore);
    }

    public async Task<List<(int PlayerId, string PlayerName, int BestScore, int TotalGames, DateTime AchievedAtUtc)>>
        GetMiniGameLeaderboardAsync(string game, string? mode, int top)
    {
        var query = _dbContext.MiniGameRoundPlayers
            .Include(rp => rp.Round)
            .Include(rp => rp.Player)
            .Where(rp => rp.Round != null && rp.Round.Game == game);

        if (!string.IsNullOrEmpty(mode))
            query = query.Where(rp => rp.Round!.Mode == mode);

        var clamped = Math.Clamp(top, 1, 100);

        var raw = await query
            .GroupBy(rp => new { rp.PlayerId, PlayerName = rp.Player!.Name })
            .Select(g => new
            {
                g.Key.PlayerId,
                g.Key.PlayerName,
                BestScore = g.Max(rp => rp.Score),
                TotalGames = g.Count(),
                AchievedAtUtc = g.Max(rp => rp.CompletedAtUtc)
            })
            .OrderByDescending(e => e.BestScore)
            .Take(clamped)
            .ToListAsync();

        return raw.Select(r => (r.PlayerId, r.PlayerName, r.BestScore, r.TotalGames, r.AchievedAtUtc)).ToList();
    }

    public async Task<List<(string Game, string Mode, int BestScore, int TotalGames, int TotalXpEarned, DateTime LastPlayedAtUtc)>>
        GetPlayerMiniGameStatsAsync(int playerId)
    {
        var raw = await _dbContext.MiniGameRoundPlayers
            .Include(rp => rp.Round)
            .Where(rp => rp.PlayerId == playerId && rp.Round != null)
            .GroupBy(rp => new { rp.Round!.Game, rp.Round.Mode })
            .Select(g => new
            {
                g.Key.Game,
                g.Key.Mode,
                BestScore = g.Max(rp => rp.Score),
                TotalGames = g.Count(),
                TotalXpEarned = g.Sum(rp => rp.XpEarned),
                LastPlayedAtUtc = g.Max(rp => rp.CompletedAtUtc)
            })
            .OrderBy(s => s.Game).ThenBy(s => s.Mode)
            .ToListAsync();

        return raw.Select(r => (r.Game, r.Mode, r.BestScore, r.TotalGames, r.TotalXpEarned, r.LastPlayedAtUtc)).ToList();
    }

    // ── AV GAME CATALOG ──

    public async Task<AvGame?> GetAvGameByIdAsync(int id)
    {
        return await _dbContext.AvGames
            .Include(g => g.Modes.OrderBy(m => m.SortOrder))
            .Include(g => g.Achievements.OrderBy(a => a.SortOrder))
            .Include(g => g.Configuration)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<AvGame?> GetAvGameByCodeAsync(string code)
    {
        return await _dbContext.AvGames
            .Include(g => g.Modes.OrderBy(m => m.SortOrder))
            .Include(g => g.Achievements.OrderBy(a => a.SortOrder))
            .FirstOrDefaultAsync(g => g.Code == code);
    }

    public async Task<IEnumerable<AvGame>> GetAllAvGamesAsync(bool includeDisabled = false)
    {
        var query = _dbContext.AvGames
            .Include(g => g.Modes.Where(m => includeDisabled || m.IsEnabled).OrderBy(m => m.SortOrder))
            .AsQueryable();

        if (!includeDisabled)
            query = query.Where(g => g.IsEnabled);

        return await query.OrderBy(g => g.SortOrder).ThenBy(g => g.Name).ToListAsync();
    }

    public async Task<int> AddAvGameAsync(AvGame game)
    {
        _dbContext.AvGames.Add(game);
        await _dbContext.SaveChangesAsync();
        return game.Id;
    }

    public async Task<bool> UpdateAvGameAsync(AvGame game)
    {
        game.UpdatedAtUtc = DateTime.UtcNow;
        _dbContext.AvGames.Update(game);
        return await _dbContext.SaveChangesAsync() > 0;
    }

    public async Task<AvGameConfiguration?> GetAvGameConfigurationAsync(int gameId)
    {
        return await _dbContext.AvGameConfigurations.FirstOrDefaultAsync(c => c.GameId == gameId);
    }

    public async Task UpsertAvGameConfigurationAsync(AvGameConfiguration config)
    {
        var existing = await _dbContext.AvGameConfigurations.FirstOrDefaultAsync(c => c.GameId == config.GameId);
        if (existing != null)
        {
            existing.ConfigJson = config.ConfigJson;
            existing.ScoringJson = config.ScoringJson;
            existing.XpMultiplier = config.XpMultiplier;
            existing.Notes = config.Notes;
            existing.LastEditedByUserId = config.LastEditedByUserId;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            _dbContext.AvGameConfigurations.Add(config);
        }
        await _dbContext.SaveChangesAsync();
    }

    public async Task<AvGameSettings?> GetAvGameSettingsAsync(int gameId, int playerId)
    {
        return await _dbContext.AvGameSettings.FirstOrDefaultAsync(s => s.GameId == gameId && s.PlayerId == playerId);
    }

    public async Task UpsertAvGameSettingsAsync(AvGameSettings settings)
    {
        var existing = await _dbContext.AvGameSettings.FirstOrDefaultAsync(s => s.GameId == settings.GameId && s.PlayerId == settings.PlayerId);
        if (existing != null)
        {
            existing.SettingsJson = settings.SettingsJson;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            _dbContext.AvGameSettings.Add(settings);
        }
        await _dbContext.SaveChangesAsync();
    }

    public async Task<IEnumerable<AvGameSave>> GetAvGameSavesAsync(int gameId, int playerId)
    {
        return await _dbContext.AvGameSaves
            .Where(s => s.GameId == gameId && s.PlayerId == playerId)
            .OrderByDescending(s => s.UpdatedAtUtc)
            .ToListAsync();
    }

    public async Task UpsertAvGameSaveAsync(AvGameSave save)
    {
        var existing = await _dbContext.AvGameSaves.FirstOrDefaultAsync(s =>
            s.GameId == save.GameId && s.PlayerId == save.PlayerId && s.SlotName == save.SlotName);
        if (existing != null)
        {
            existing.DataJson = save.DataJson;
            existing.MetadataJson = save.MetadataJson;
            existing.GameVersion = save.GameVersion;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            _dbContext.AvGameSaves.Add(save);
        }
        await _dbContext.SaveChangesAsync();
    }

    public async Task<bool> DeleteAvGameSaveAsync(int saveId)
    {
        var save = await _dbContext.AvGameSaves.FindAsync(saveId);
        if (save == null) return false;
        _dbContext.AvGameSaves.Remove(save);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<AvGameAsset>> GetAvGameAssetsAsync(int gameId)
    {
        return await _dbContext.AvGameAssets
            .Where(a => a.GameId == gameId)
            .OrderBy(a => a.SortOrder)
            .ToListAsync();
    }

    public async Task<int> AddAvGameAssetAsync(AvGameAsset asset)
    {
        _dbContext.AvGameAssets.Add(asset);
        await _dbContext.SaveChangesAsync();
        return asset.Id;
    }

    public async Task<bool> DeleteAvGameAssetAsync(int assetId)
    {
        var asset = await _dbContext.AvGameAssets.FindAsync(assetId);
        if (asset == null) return false;
        _dbContext.AvGameAssets.Remove(asset);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ── Board Game Stats ──

    public async Task<IEnumerable<BoardGameSessionRoundPartPlayer>> GetPartPlayersByPlayerAsync(int playerId, CancellationToken ct = default)
        => await _dbContext.BoardGameSessionRoundPartPlayers
            .Where(pp => pp.PlayerId == playerId)
            .ToListAsync(ct);

    public async Task<IEnumerable<BoardGameSession>> GetSessionsByPlayerAsync(int playerId, CancellationToken ct = default)
    {
        var sessionIds = await _dbContext.BoardGameSessionRoundPartPlayers
            .Where(pp => pp.PlayerId == playerId)
            .Select(pp => pp.Part!.Round!.SessionId)
            .Distinct()
            .ToListAsync(ct);

        return await _dbContext.BoardGameSessions
            .Where(s => sessionIds.Contains(s.Id))
            .Include(s => s.Rounds).ThenInclude(r => r.Parts).ThenInclude(p => p.Players)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<BoardGameSession>> GetSessionsByBoardGameAsync(int boardGameId, CancellationToken ct = default)
    {
        var eventIds = await _dbContext.EventBoardGames
            .Where(e => e.BoardGameId == boardGameId)
            .Select(e => e.EventId)
            .ToListAsync(ct);

        return await _dbContext.BoardGameSessions
            .Where(s => eventIds.Contains(s.EventId))
            .Include(s => s.Rounds).ThenInclude(r => r.Parts).ThenInclude(p => p.Players)
            .ToListAsync(ct);
    }

    public async Task<EventBoardGameSession?> GetEventBoardGameByEventAsync(int eventId, CancellationToken ct = default)
        => await _dbContext.EventBoardGames
            .Include(e => e.BoardGame)
            .FirstOrDefaultAsync(e => e.EventId == eventId, ct);

    // ── BGG Sync ──

    public async Task<BggSyncStatus> GetBggSyncStatusAsync()
    {
        var status = await _dbContext.Set<BggSyncStatus>().FirstOrDefaultAsync();
        if (status == null)
        {
            status = new BggSyncStatus();
            _dbContext.Set<BggSyncStatus>().Add(status);
            await _dbContext.SaveChangesAsync();
        }
        return status;
    }

    public async Task UpdateBggSyncStatusAsync(BggSyncStatus status)
    {
        _dbContext.Set<BggSyncStatus>().Update(status);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<int> UpsertBoardGamesFromBggAsync(IEnumerable<BoardGame> games)
    {
        int count = 0;
        foreach (var game in games)
        {
            var existing = await _dbContext.BoardGames
                .FirstOrDefaultAsync(g => g.BggId == game.BggId);

            if (existing != null)
            {
                existing.Name = game.Name;
                existing.Description = game.Description;
                existing.MinPlayers = game.MinPlayers;
                existing.MaxPlayers = game.MaxPlayers;
                existing.EstimatedDurationMinutes = game.EstimatedDurationMinutes;
                existing.BggImageUrl = game.BggImageUrl;
                existing.BggThumbnailUrl = game.BggThumbnailUrl;
                existing.BggRating = game.BggRating;
                existing.BggYearPublished = game.BggYearPublished;
                existing.BggWeight = game.BggWeight;
                existing.BggRank = game.BggRank;
                existing.BggUsersRated = game.BggUsersRated;
                existing.BggMinAge = game.BggMinAge;
                existing.BggCategories = game.BggCategories;
                existing.BggMechanics = game.BggMechanics;
                existing.BggDesigners = game.BggDesigners;
                existing.BggPublishers = game.BggPublishers;
                existing.BggLastSyncUtc = DateTime.UtcNow;
                existing.IsFullBggData = game.IsFullBggData;
            }
            else
            {
                game.BggLastSyncUtc = DateTime.UtcNow;
                _dbContext.BoardGames.Add(game);
            }
            count++;
        }
        await _dbContext.SaveChangesAsync();
        return count;
    }

    public async Task<List<BoardGame>> GetAllBggBoardGamesAsync()
        => await _dbContext.BoardGames
            .Where(g => g.BggId != null)
            .OrderBy(g => g.BggId)
            .AsNoTracking()
            .ToListAsync();

    public async Task<int> GetBggBoardGameCountAsync()
        => await _dbContext.BoardGames.CountAsync(g => g.BggId != null);
}
