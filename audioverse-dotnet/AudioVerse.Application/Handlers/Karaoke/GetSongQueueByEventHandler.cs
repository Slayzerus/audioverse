using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetSongQueueByEventHandler(IKaraokeRepository r) : IRequestHandler<GetSongQueueByEventQuery, IEnumerable<KaraokeSongFileQueueItem>>
    { public Task<IEnumerable<KaraokeSongFileQueueItem>> Handle(GetSongQueueByEventQuery req, CancellationToken ct) => r.GetSongQueueByEventAsync(req.EventId); }
}
