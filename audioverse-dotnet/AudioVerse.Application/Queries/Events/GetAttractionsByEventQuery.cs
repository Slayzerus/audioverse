using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetAttractionsByEventQuery(int EventId) : IRequest<IEnumerable<EventAttraction>>;
}
