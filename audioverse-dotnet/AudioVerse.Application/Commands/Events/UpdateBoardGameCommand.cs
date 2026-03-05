using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateBoardGameCommand(BoardGame Game) : IRequest<bool>;
}
