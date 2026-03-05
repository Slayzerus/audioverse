using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetAdminDashboardHandler : IRequestHandler<GetAdminDashboardQuery, AdminDashboardDto>
    {
        private readonly IAuditRepository _audit;
        public GetAdminDashboardHandler(IAuditRepository audit) { _audit = audit; }

        public async Task<AdminDashboardDto> Handle(GetAdminDashboardQuery req, CancellationToken ct)
        {
            var (totalUsers, activeEvents, totalSongs, totalParties, totalAbuseReports, pendingAbuseReports, activeBans) = await _audit.GetDashboardStatsAsync(ct);

            var dto = new AdminDashboardDto
            {
                TotalUsers = totalUsers,
                ActiveEvents = activeEvents,
                TotalSongs = totalSongs,
                TotalParties = totalParties,
                TotalAbuseReports = totalAbuseReports,
                PendingAbuseReports = pendingAbuseReports,
                ActiveBans = activeBans,
            };

            return dto;
        }
    }
}
