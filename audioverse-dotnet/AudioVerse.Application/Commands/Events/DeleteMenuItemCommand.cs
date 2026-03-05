using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteMenuItemCommand(int Id) : IRequest<bool>;
}
