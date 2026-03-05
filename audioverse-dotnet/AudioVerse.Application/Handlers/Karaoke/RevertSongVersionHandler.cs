using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class RevertSongVersionHandler : IRequestHandler<RevertSongVersionCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        private readonly AudioVerse.Application.Services.ICurrentUserService _currentUser;
        public RevertSongVersionHandler(IKaraokeRepository repo, AudioVerse.Application.Services.ICurrentUserService currentUser) { _repo = repo; _currentUser = currentUser; }
        public async Task<bool> Handle(RevertSongVersionCommand request, CancellationToken cancellationToken)
        {
            // permission: admin OR owner OR collaborator with Manage
            if (!_currentUser.IsAdmin)
            {
                var uid = _currentUser.UserId;
                if (!uid.HasValue) throw new AudioVerse.Application.Exceptions.NotAuthorizedException();
                var song = await _repo.GetSongByIdAsync(request.SongId);
                if (song == null) throw new AudioVerse.Application.Exceptions.NotFoundException("Song not found");
                if (song.OwnerId != uid.Value)
                {
                    var perm = await _repo.GetCollaboratorPermissionAsync(request.SongId, uid.Value);
                    if (perm == null || perm != AudioVerse.Domain.Enums.CollaborationPermission.Manage) throw new AudioVerse.Application.Exceptions.NotAuthorizedException();
                }
            }

            return await _repo.RevertSongToVersionAsync(request.SongId, request.Version, request.ChangedByUserId, request.Reason);
        }
    }
}
