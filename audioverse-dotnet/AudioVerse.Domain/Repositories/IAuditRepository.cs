using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for audit log operations.
/// </summary>
public interface IAuditRepository
{
    /// <summary>
    /// Creates a new audit log entry.
    /// </summary>
    /// <param name="log">The audit log entry to create</param>
    /// <returns>The ID of the created log entry</returns>
    Task<int> CreateLogAsync(AuditLog log);

    /// <summary>
    /// Retrieves paginated audit logs with optional filters.
    /// </summary>
    /// <param name="from">Filter logs from this date</param>
    /// <param name="to">Filter logs until this date</param>
    /// <param name="action">Filter by action type</param>
    /// <param name="userId">Filter by user ID</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>Collection of matching audit logs</returns>
    Task<IEnumerable<AuditLog>> GetLogsAsync(
        DateTime? from = null,
        DateTime? to = null,
        string? action = null,
        int? userId = null,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Gets the total count of logs matching the filters.
    /// </summary>
    Task<int> GetLogCountAsync(
        DateTime? from = null,
        DateTime? to = null,
        string? action = null,
        int? userId = null);

    /// <summary>
    /// Deletes audit logs older than the specified date.
    /// </summary>
    /// <param name="before">Delete logs before this date</param>
    /// <returns>Number of deleted entries</returns>
    Task<int> DeleteLogsOlderThanAsync(DateTime before);

    /// <summary>
    /// Gets distinct action types from the audit log.
    /// </summary>
    Task<IEnumerable<string>> GetDistinctActionsAsync();

    // ── User Bans ──

    /// <summary>Bans a user.</summary>
    Task<int> AddBanAsync(UserBan ban);

    /// <summary>Deactivates a ban.</summary>
    Task<bool> LiftBanAsync(int banId);

    /// <summary>Gets active bans for a user.</summary>
    Task<IEnumerable<UserBan>> GetActiveBansAsync(int userId);

    // ── Dashboard stats ──

    /// <summary>Gets dashboard statistics (counts of various entities).</summary>
    Task<(int TotalUsers, int ActiveEvents, int TotalSongs, int TotalParties, int TotalAbuseReports, int PendingAbuseReports, int ActiveBans)> GetDashboardStatsAsync(CancellationToken ct = default);

    // ── Permission change history ──

    /// <summary>Gets permission change history for a user.</summary>
    Task<IEnumerable<AuditLog>> GetPermissionChangeHistoryAsync(int? userId, int page, int pageSize, CancellationToken ct = default);

    /// <summary>Gets permission change audit logs filtered for an event with dynamic sorting and paging.</summary>
    Task<(IEnumerable<AuditLog> Items, int Total)> GetPermissionChangeLogsAsync(
        int eventId, int? userId, string? action, DateTime? from, DateTime? to,
        string? sortBy, string? sortDir, int page, int pageSize, CancellationToken ct = default);

    // ── Entity Change Logs ──

    /// <summary>Gets entity change logs filtered by entity name/id.</summary>
    Task<IEnumerable<EntityChangeLog>> GetEntityChangeLogsAsync(string? entityName, string? entityId, int page, int pageSize, CancellationToken ct = default);
}
