using AudioVerse.Application.Models.Dtos;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get all unique event organizers (Id + Name) for dropdown filters.</summary>
public record GetDistinctOrganizersQuery : IRequest<IEnumerable<EventOrganizerDto>>;
