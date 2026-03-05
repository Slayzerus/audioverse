using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Queries.Audio
{
    public record GetActiveGenresQuery() : IRequest<IEnumerable<MusicGenre>>;
}
