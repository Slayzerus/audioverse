using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateMenuItemCommand(EventMenuItem Item) : IRequest<bool>;
}
