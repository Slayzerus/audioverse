using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteEventTabCommand(int Id) : IRequest<bool>;
}
