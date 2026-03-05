using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get all organizations (paged).</summary>
public record GetOrganizationsQuery(int Page = 1, int PageSize = 20) : IRequest<(IEnumerable<Organization> Items, int TotalCount)>;
