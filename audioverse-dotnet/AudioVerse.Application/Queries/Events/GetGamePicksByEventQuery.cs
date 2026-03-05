using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetGamePicksByEventQuery(int EventId) : IRequest<IEnumerable<EventSessionGamePick>>;
