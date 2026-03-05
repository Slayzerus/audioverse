using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class RemoveCollaboratorHandler(IKaraokeRepository repo) : IRequestHandler<RemoveCollaboratorCommand, bool>
{
    public Task<bool> Handle(RemoveCollaboratorCommand req, CancellationToken ct)
        => repo.RemoveCollaboratorAsync(req.SongId, req.UserId);
}
