using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Http;

namespace AudioVerse.Application.Services.User
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IAuditRepository _auditRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAuditLogBroadcaster? _broadcaster;

        public AuditLogService(IAuditRepository auditRepo, IHttpContextAccessor httpContextAccessor, IAuditLogBroadcaster? broadcaster = null)
        {
            _auditRepo = auditRepo;
            _httpContextAccessor = httpContextAccessor;
            _broadcaster = broadcaster;
        }

        public async Task LogActionAsync(int? userId, string? username, string action, string description, bool success, string? errorMessage = null, string? detailsJson = null)
        {
            var resolvedUsername = username
                ?? _httpContextAccessor.HttpContext?.User?.FindFirst("username")?.Value
                ?? "system";

            var auditLog = new AuditLog
            {
                UserId = userId,
                Username = resolvedUsername,
                Action = action,
                Description = description,
                DetailsJson = detailsJson,
                Success = success,
                ErrorMessage = errorMessage,
                Timestamp = DateTime.UtcNow,
                IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
                UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString()
            };

            await _auditRepo.CreateLogAsync(auditLog);

            if (_broadcaster != null)
                await _broadcaster.BroadcastAsync(auditLog);
        }

        public async Task<List<AuditLog>> GetUserAuditLogsAsync(int userId)
        {
            var logs = await _auditRepo.GetLogsAsync(userId: userId);
            return logs.ToList();
        }

        public async Task<List<AuditLog>> GetAllAuditLogsAsync()
        {
            var logs = await _auditRepo.GetLogsAsync();
            return logs.ToList();
        }
    }
}
