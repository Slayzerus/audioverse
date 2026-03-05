using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IAuditRepository.
/// Handles audit log persistence and retrieval.
/// </summary>
public class AuditRepositoryEF : IAuditRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<AuditRepositoryEF> _logger;

    public AuditRepositoryEF(AudioVerseDbContext dbContext, ILogger<AuditRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<int> CreateLogAsync(AuditLog log)
    {
        _dbContext.AuditLogs.Add(log);
        await _dbContext.SaveChangesAsync();
        return log.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<AuditLog>> GetLogsAsync(
        DateTime? from = null,
        DateTime? to = null,
        string? action = null,
        int? userId = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = BuildFilteredQuery(from, to, action, userId);

        return await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<int> GetLogCountAsync(
        DateTime? from = null,
        DateTime? to = null,
        string? action = null,
        int? userId = null)
    {
        var query = BuildFilteredQuery(from, to, action, userId);
        return await query.CountAsync();
    }

    /// <inheritdoc />
    public async Task<int> DeleteLogsOlderThanAsync(DateTime before)
    {
        var logsToDelete = await _dbContext.AuditLogs
            .Where(l => l.Timestamp < before)
            .ToListAsync();

        if (logsToDelete.Count == 0)
            return 0;

        _dbContext.AuditLogs.RemoveRange(logsToDelete);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted {Count} audit logs older than {Before}", logsToDelete.Count, before);
        return logsToDelete.Count;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<string>> GetDistinctActionsAsync()
    {
        return await _dbContext.AuditLogs
            .Select(l => l.Action)
            .Where(a => a != null)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync();
    }

    /// <summary>
    /// Builds a filtered query based on the provided parameters.
    /// </summary>
    private IQueryable<AuditLog> BuildFilteredQuery(
        DateTime? from,
        DateTime? to,
        string? action,
        int? userId)
    {
        var query = _dbContext.AuditLogs.AsQueryable();

        if (from.HasValue)
            query = query.Where(l => l.Timestamp >= from.Value);
        
        if (to.HasValue)
            query = query.Where(l => l.Timestamp <= to.Value);
        
        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action == action);
        
        if (userId.HasValue)
            query = query.Where(l => l.UserId == userId.Value);

        return query;
    }

    public async Task<int> AddBanAsync(AudioVerse.Domain.Entities.Admin.UserBan ban)
    {
        _dbContext.UserBans.Add(ban);
        await _dbContext.SaveChangesAsync();
        return ban.Id;
    }

    public async Task<bool> LiftBanAsync(int banId)
    {
        var ban = await _dbContext.UserBans.FindAsync(banId);
        if (ban == null) return false;
        ban.IsActive = false;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<AudioVerse.Domain.Entities.Admin.UserBan>> GetActiveBansAsync(int userId)
    {
        return await _dbContext.UserBans.Where(b => b.UserId == userId && b.IsActive).ToListAsync();
    }

    public async Task<(int TotalUsers, int ActiveEvents, int TotalSongs, int TotalParties, int TotalAbuseReports, int PendingAbuseReports, int ActiveBans)> GetDashboardStatsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return (
            await _dbContext.Users.CountAsync(ct),
            await _dbContext.Events.CountAsync(e => e.EndTime == null || e.EndTime > now, ct),
            await _dbContext.KaraokeSongs.CountAsync(ct),
            await _dbContext.Events.CountAsync(e => e.Type == AudioVerse.Domain.Enums.Events.EventType.Event, ct),
            await _dbContext.AbuseReports.CountAsync(ct),
            await _dbContext.AbuseReports.CountAsync(r => !r.Resolved, ct),
            await _dbContext.UserBans.CountAsync(b => b.IsActive && (b.ExpiresAt == null || b.ExpiresAt > now), ct)
        );
    }

    public async Task<IEnumerable<AudioVerse.Domain.Entities.EntityChangeLog>> GetEntityChangeLogsAsync(string? entityName, string? entityId, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _dbContext.EntityChangeLogs.AsQueryable();
        if (!string.IsNullOrEmpty(entityName)) q = q.Where(e => e.EntityName == entityName);
        if (!string.IsNullOrEmpty(entityId)) q = q.Where(e => e.EntityId == entityId);
        return await q.OrderByDescending(e => e.Timestamp).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
    }

    public async Task<IEnumerable<AuditLog>> GetPermissionChangeHistoryAsync(int? userId, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _dbContext.AuditLogs.Where(l => l.Action != null && (l.Action.Contains("Permission") || l.Action.Contains("Role") || l.Action.Contains("Ban")));
        if (userId.HasValue) q = q.Where(l => l.UserId == userId.Value);
        return await q.OrderByDescending(l => l.Timestamp).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
    }

    public async Task<(IEnumerable<AuditLog> Items, int Total)> GetPermissionChangeLogsAsync(
        int eventId, int? userId, string? action, DateTime? from, DateTime? to,
        string? sortBy, string? sortDir, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _dbContext.AuditLogs.AsQueryable();
        q = q.Where(l => l.Action == "GrantPermission" || l.Action == "RevokePermission" || l.Action == "BulkUpdatePermissions" || l.Action == "BulkRevokePermissions");
        q = q.Where(l => l.DetailsJson != null && l.DetailsJson.Contains($"\"EventId\":{eventId}"));

        if (userId.HasValue) q = q.Where(l => l.UserId == userId.Value);
        if (!string.IsNullOrEmpty(action)) q = q.Where(l => l.Action == action);
        if (from.HasValue) q = q.Where(l => l.Timestamp >= from.Value);
        if (to.HasValue) q = q.Where(l => l.Timestamp <= to.Value);

        var dir = (sortDir ?? "desc").ToLowerInvariant();
        q = (sortBy?.ToLowerInvariant()) switch
        {
            "timestamp" => dir == "asc" ? q.OrderBy(l => l.Timestamp) : q.OrderByDescending(l => l.Timestamp),
            "userid" => dir == "asc" ? q.OrderBy(l => l.UserId) : q.OrderByDescending(l => l.UserId),
            "action" => dir == "asc" ? q.OrderBy(l => l.Action) : q.OrderByDescending(l => l.Action),
            _ => q.OrderByDescending(l => l.Timestamp)
        };

        var total = await q.CountAsync(ct);
        var skip = (Math.Max(1, page) - 1) * Math.Max(1, pageSize);
        var items = await q.Skip(skip).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }
}
