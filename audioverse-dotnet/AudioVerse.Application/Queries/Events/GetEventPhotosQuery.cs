using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventPhotosQuery(int EventId) : IRequest<IEnumerable<EventPhoto>>;
