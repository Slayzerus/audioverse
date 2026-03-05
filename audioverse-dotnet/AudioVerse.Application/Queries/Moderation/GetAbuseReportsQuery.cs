using MediatR;
using AudioVerse.Application.Models.Moderation;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Moderation
{
    public record GetAbuseReportsQuery(string? Status = null, int Take = 100) : IRequest<List<AbuseReportDto>>;
}
