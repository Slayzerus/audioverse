using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateEventTabCommand(EventTab Tab) : IRequest<bool>;
}
