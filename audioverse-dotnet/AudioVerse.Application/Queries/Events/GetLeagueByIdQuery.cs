using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get a league by ID with participants and events.</summary>
public record GetLeagueByIdQuery(int Id) : IRequest<League?>;
