using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record AddEventTabCommand(EventTab Tab) : IRequest<int>;
}
