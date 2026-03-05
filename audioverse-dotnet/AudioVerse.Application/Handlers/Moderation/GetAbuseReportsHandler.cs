using AudioVerse.Application.Models.Moderation;
using AudioVerse.Application.Queries.Moderation;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Moderation
{
    public class GetAbuseReportsHandler : IRequestHandler<GetAbuseReportsQuery, List<AbuseReportDto>>
    {
        private readonly IModerationRepository _moderationRepository;
        
        public GetAbuseReportsHandler(IModerationRepository moderationRepository)
        {
            _moderationRepository = moderationRepository;
        }

        public async Task<List<AbuseReportDto>> Handle(GetAbuseReportsQuery request, CancellationToken cancellationToken)
        {
            bool? isResolved = request.Status switch
            {
                "open" => false,
                "resolved" => true,
                _ => null
            };

            var reports = await _moderationRepository.GetReportsAsync(
                isResolved: isResolved,
                contentType: null,
                page: 1,
                pageSize: request.Take);

            return reports.Select(r => new AbuseReportDto
            {
                Id = r.Id,
                ReporterUserId = r.ReporterUserId,
                ReporterUsername = r.ReporterUsername,
                TargetType = r.TargetType,
                TargetValue = r.TargetValue,
                Reason = r.Reason,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                Resolved = r.Resolved,
                ModeratorComment = r.ModeratorComment,
                ResolvedAt = r.ResolvedAt
            }).ToList();
        }
    }
}
