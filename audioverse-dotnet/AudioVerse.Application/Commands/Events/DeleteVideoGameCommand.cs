using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteVideoGameCommand(int Id) : IRequest<bool>;
}
