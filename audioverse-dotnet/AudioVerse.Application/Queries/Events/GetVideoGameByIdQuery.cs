using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetVideoGameByIdQuery(int Id) : IRequest<VideoGame?>;
}
