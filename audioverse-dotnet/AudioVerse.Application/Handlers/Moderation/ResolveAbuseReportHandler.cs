using AudioVerse.Application.Commands.Moderation;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Moderation
{
    public class ResolveAbuseReportHandler : IRequestHandler<ResolveAbuseReportCommand, bool>
    {
        private readonly IModerationRepository _moderationRepository;
        
        public ResolveAbuseReportHandler(IModerationRepository moderationRepository)
        {
            _moderationRepository = moderationRepository;
        }

        public async Task<bool> Handle(ResolveAbuseReportCommand request, CancellationToken cancellationToken)
        {
            return await _moderationRepository.ResolveReportAsync(
                request.ReportId,
                request.ModeratorUserId,
                request.ModeratorComment ?? string.Empty);
        }
    }
}
