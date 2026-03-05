using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get an organization by ID.</summary>
public record GetOrganizationByIdQuery(int Id) : IRequest<Organization?>;
