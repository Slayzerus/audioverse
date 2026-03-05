using MediatR;

namespace AudioVerse.Application.Commands.Moderation
{
    public record ResolveAbuseReportCommand(int ReportId, bool Resolved, string? ModeratorComment, int ModeratorUserId = 0) : IRequest<bool>;
}
