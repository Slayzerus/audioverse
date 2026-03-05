using AudioVerse.Domain.Entities.Admin;

namespace AudioVerse.Application.Services.User;

public interface IAuditLogBroadcaster
{
    Task BroadcastAsync(AuditLog log);
}
