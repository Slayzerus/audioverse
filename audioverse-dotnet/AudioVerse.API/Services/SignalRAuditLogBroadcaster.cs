using AudioVerse.API.Areas.Admin.Hubs;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities.Admin;
using Microsoft.AspNetCore.SignalR;

namespace AudioVerse.API.Services
{
    public class SignalRAuditLogBroadcaster : IAuditLogBroadcaster
    {
        private readonly IHubContext<AdminHub> _hub;
        public SignalRAuditLogBroadcaster(IHubContext<AdminHub> hub) { _hub = hub; }

        public async Task BroadcastAsync(AuditLog log)
        {
            await _hub.Clients.All.SendAsync("LogEntry", new
            {
                log.Timestamp,
                Level = log.Success ? "Info" : "Error",
                Message = $"[{log.Action}] {log.Description}",
                Source = log.Username,
                log.UserId,
                log.IpAddress
            });
        }
    }
}
