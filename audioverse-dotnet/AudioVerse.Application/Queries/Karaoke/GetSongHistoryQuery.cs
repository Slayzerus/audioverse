using MediatR;
using System.Collections.Generic;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetSongHistoryQuery(int SongId) : IRequest<IEnumerable<KaraokeSongFileHistory>>;
}
