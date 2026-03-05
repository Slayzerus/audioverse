using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class RemoveSongQueueItemHandler(IKaraokeRepository r) : IRequestHandler<RemoveSongQueueItemCommand, bool>
    { public Task<bool> Handle(RemoveSongQueueItemCommand req, CancellationToken ct) => r.RemoveSongQueueItemAsync(req.Id); }
}
