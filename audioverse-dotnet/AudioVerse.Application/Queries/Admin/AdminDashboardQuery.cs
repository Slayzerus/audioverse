using MediatR;

namespace AudioVerse.Application.Queries.Admin
{
    public record GetAdminDashboardQuery() : IRequest<AdminDashboardDto>;
}
