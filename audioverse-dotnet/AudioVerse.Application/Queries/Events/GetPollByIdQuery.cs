using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>
/// Query to get a poll by ID.
/// </summary>
public record GetPollByIdQuery(int PollId) : IRequest<EventPoll?>;
