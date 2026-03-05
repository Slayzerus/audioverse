using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get leagues by organization or all leagues (paged).</summary>
public record GetLeaguesQuery(int? OrganizationId = null, int Page = 1, int PageSize = 20) : IRequest<(IEnumerable<League> Items, int TotalCount)>;
