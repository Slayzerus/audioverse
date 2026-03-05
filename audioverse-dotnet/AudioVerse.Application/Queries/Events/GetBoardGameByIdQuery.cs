using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetBoardGameByIdQuery(int Id) : IRequest<BoardGame?>;
}
