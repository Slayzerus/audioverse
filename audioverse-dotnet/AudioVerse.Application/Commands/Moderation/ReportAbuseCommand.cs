using MediatR;

namespace AudioVerse.Application.Commands.Moderation
{
    public record ReportAbuseCommand(int? ReporterUserId, string? ReporterUsername, string TargetType, string TargetValue, string Reason, string? Comment) : IRequest<bool>;
}
