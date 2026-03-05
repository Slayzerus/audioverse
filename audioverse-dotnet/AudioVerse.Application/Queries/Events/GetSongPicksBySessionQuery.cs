using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetSongPicksBySessionQuery(int EventId, int SessionId) : IRequest<IEnumerable<EventSessionSongPick>>;
