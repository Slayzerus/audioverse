using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetSongHistoryHandler : IRequestHandler<GetSongHistoryQuery, IEnumerable<KaraokeSongFileHistory>>
    {
        private readonly IKaraokeRepository _repo;
        private readonly AudioVerse.Application.Services.ICurrentUserService _currentUser;
        public GetSongHistoryHandler(IKaraokeRepository repo, AudioVerse.Application.Services.ICurrentUserService currentUser) { _repo = repo; _currentUser = currentUser; }
        public async Task<IEnumerable<KaraokeSongFileHistory>> Handle(GetSongHistoryQuery request, CancellationToken cancellationToken)
        {
            // permission: admin OR owner OR collaborator with Manage
            if (!_currentUser.IsAdmin)
            {
                var uid = _currentUser.UserId;
                if (!uid.HasValue) throw new AudioVerse.Application.Exceptions.NotAuthorizedException();
                var song = await _repo.GetSongByIdAsync(request.SongId);
                if (song == null) throw new AudioVerse.Application.Exceptions.NotFoundException("Song not found");
                if (song.OwnerId == uid.Value) return await _repo.GetSongHistoryAsync(request.SongId);
                var perm = await _repo.GetCollaboratorPermissionAsync(request.SongId, uid.Value);
                if (perm == null || perm != AudioVerse.Domain.Enums.CollaborationPermission.Manage) throw new AudioVerse.Application.Exceptions.NotAuthorizedException();
            }

            return await _repo.GetSongHistoryAsync(request.SongId);
        }
    }
}
