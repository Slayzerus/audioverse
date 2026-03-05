using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record AddBoardGameCommand(BoardGame Game) : IRequest<int>;
}
