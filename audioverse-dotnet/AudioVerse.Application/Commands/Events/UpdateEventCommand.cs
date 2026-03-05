using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateEventCommand(Event Event) : IRequest<bool>;
}
