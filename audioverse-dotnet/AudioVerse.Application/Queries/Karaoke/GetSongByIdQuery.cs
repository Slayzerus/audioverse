using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetSongByIdQuery(int Id) : IRequest<KaraokeSongFile?>;
}
