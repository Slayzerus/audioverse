using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetVideoGameSessionByIdQuery(int Id) : IRequest<VideoGameSession?>;
}
