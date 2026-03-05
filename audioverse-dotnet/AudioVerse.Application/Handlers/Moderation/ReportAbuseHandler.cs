using AudioVerse.Application.Commands.Moderation;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Moderation
{
    public class ReportAbuseHandler : IRequestHandler<ReportAbuseCommand, bool>
    {
        private readonly IModerationRepository _moderationRepository;
        
        public ReportAbuseHandler(IModerationRepository moderationRepository)
        {
            _moderationRepository = moderationRepository;
        }

        public async Task<bool> Handle(ReportAbuseCommand request, CancellationToken cancellationToken)
        {
            var report = new AbuseReport
            {
                ReporterUserId = request.ReporterUserId,
                ReporterUsername = request.ReporterUsername,
                TargetType = request.TargetType,
                TargetValue = request.TargetValue,
                Reason = request.Reason,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };
            
            await _moderationRepository.CreateReportAsync(report);
            return true;
        }
    }
}
