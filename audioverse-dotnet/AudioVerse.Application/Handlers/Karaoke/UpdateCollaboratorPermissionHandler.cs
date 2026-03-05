using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class UpdateCollaboratorPermissionHandler(IKaraokeRepository repo) : IRequestHandler<UpdateCollaboratorPermissionCommand, bool>
{
    public Task<bool> Handle(UpdateCollaboratorPermissionCommand req, CancellationToken ct)
        => repo.UpdateCollaboratorPermissionAsync(req.SongId, req.UserId, req.Permission);
}
