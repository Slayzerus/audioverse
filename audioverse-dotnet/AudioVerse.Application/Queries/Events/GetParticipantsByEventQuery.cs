using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Queries.Events
{
    public record GetParticipantsByEventQuery(int EventId) : IRequest<IEnumerable<EventParticipant>>;
}
