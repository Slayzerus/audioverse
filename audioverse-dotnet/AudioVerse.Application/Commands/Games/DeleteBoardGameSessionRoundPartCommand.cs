using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteBoardGameSessionRoundPartCommand(int Id) : IRequest<bool>;
}
