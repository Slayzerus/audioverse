using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventVideosQuery(int EventId) : IRequest<IEnumerable<EventVideo>>;
