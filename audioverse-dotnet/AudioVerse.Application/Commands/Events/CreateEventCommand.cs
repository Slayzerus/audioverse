using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Commands.Events
{
    public record CreateEventCommand(Event Event) : IRequest<int>;
}
