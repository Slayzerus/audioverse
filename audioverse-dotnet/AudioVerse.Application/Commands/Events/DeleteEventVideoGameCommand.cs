using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteEventVideoGameCommand(int Id) : IRequest<bool>;
}
