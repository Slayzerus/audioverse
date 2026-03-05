using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventCommentsQuery(int EventId) : IRequest<IEnumerable<EventComment>>;
