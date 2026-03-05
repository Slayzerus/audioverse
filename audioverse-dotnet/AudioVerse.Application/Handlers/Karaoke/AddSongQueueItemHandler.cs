using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddSongQueueItemHandler(IKaraokeRepository r) : IRequestHandler<AddSongQueueItemCommand, int>
    { public Task<int> Handle(AddSongQueueItemCommand req, CancellationToken ct) => r.AddSongQueueItemAsync(req.Item); }
}
