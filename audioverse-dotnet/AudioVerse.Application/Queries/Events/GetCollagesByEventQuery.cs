using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetCollagesByEventQuery(int EventId) : IRequest<IEnumerable<EventCollage>>;
