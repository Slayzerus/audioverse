using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class UpdateSongQueueItemStatusHandler(IKaraokeRepository r) : IRequestHandler<UpdateSongQueueItemStatusCommand, bool>
    { public Task<bool> Handle(UpdateSongQueueItemStatusCommand req, CancellationToken ct) => r.UpdateSongQueueItemStatusAsync(req.Id, req.Status); }
}
