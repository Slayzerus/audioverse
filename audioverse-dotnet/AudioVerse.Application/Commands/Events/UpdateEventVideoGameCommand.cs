using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateEventVideoGameCommand(EventVideoGameSession Link) : IRequest<bool>;
}
