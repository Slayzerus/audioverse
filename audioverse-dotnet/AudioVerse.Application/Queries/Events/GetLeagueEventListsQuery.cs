using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetLeagueEventListsQuery(int LeagueId) : IRequest<IEnumerable<EventList>>;
