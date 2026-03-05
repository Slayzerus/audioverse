using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace AudioVerse.API.Areas.Admin.Hubs
{
    /// <summary>
    /// SignalR hub for admin notifications (audit logs, config changes, real-time log stream).
    /// </summary>
    public class AdminHub : Hub
    {
        public async Task BroadcastNewAuditLog(object log)
        {
            await Clients.All.SendAsync("NewAuditLog", log);
        }

        public async Task BroadcastSystemConfigChanged(object config)
        {
            await Clients.All.SendAsync("SystemConfigChanged", config);
        }

        /// <summary>Stream a log entry to all connected admins</summary>
        public async Task BroadcastLogEntry(string level, string message, string? source = null)
        {
            await Clients.All.SendAsync("LogEntry", new { Timestamp = DateTime.UtcNow, Level = level, Message = message, Source = source });
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("LogEntry", new { Timestamp = DateTime.UtcNow, Level = "Info", Message = "Connected to admin log stream", Source = "AdminHub" });
            await base.OnConnectedAsync();
        }
    }
}

