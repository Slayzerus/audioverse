using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record AddMenuItemCommand(EventMenuItem Item) : IRequest<int>;
}
