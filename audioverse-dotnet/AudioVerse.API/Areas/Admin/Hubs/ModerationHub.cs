using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace AudioVerse.API.Areas.Admin.Hubs
{
    /// <summary>
    /// SignalR hub do powiadomie? moderacyjnych (nowe zg?oszenia, rozpatrzenia).
    /// </summary>
    public class ModerationHub : Hub
    {
        // Wywo?anie przez serwer: nowe zg?oszenie nadu?ycia
        public async Task BroadcastNewAbuseReport(object report)
        {
            await Clients.All.SendAsync("NewAbuseReport", report);
        }

        // Wywo?anie przez serwer: rozpatrzenie zg?oszenia
        public async Task BroadcastAbuseReportResolved(object report)
        {
            await Clients.All.SendAsync("AbuseReportResolved", report);
        }
    }
}

