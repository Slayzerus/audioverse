using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetMediaCollectionsByEventQuery(int EventId) : IRequest<IEnumerable<EventMediaCollection>>;
