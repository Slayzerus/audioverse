using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>
/// Query to get a poll by its access token.
/// </summary>
public record GetPollByTokenQuery(string Token) : IRequest<EventPoll?>;
