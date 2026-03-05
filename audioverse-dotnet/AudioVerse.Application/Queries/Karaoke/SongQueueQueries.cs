using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using MediatR;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetSongQueueByEventQuery(int EventId) : IRequest<IEnumerable<KaraokeSongFileQueueItem>>;
}
