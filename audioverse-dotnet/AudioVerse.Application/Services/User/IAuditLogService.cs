using AudioVerse.Domain.Entities.Admin;

namespace AudioVerse.Application.Services.User;

public interface IAuditLogService
{
    Task LogActionAsync(int? userId, string? username, string action, string description, bool success, string? errorMessage = null, string? detailsJson = null);
    Task<List<AuditLog>> GetUserAuditLogsAsync(int userId);
    Task<List<AuditLog>> GetAllAuditLogsAsync();
}
