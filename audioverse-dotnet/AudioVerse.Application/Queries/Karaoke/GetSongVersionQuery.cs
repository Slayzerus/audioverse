using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetSongVersionQuery(int SongId, int Version) : IRequest<KaraokeSongFileHistory?>;
}
