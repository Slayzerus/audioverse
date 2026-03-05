using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record AddEventVideoGameCommand(EventVideoGameSession Link) : IRequest<int>;
}
