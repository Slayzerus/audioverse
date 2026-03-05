using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>
/// Query to get all polls for an event.
/// </summary>
public record GetPollsByEventQuery(int EventId) : IRequest<IEnumerable<EventPoll>>;
