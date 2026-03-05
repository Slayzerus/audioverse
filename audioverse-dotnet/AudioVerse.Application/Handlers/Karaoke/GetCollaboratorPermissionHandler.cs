using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetCollaboratorPermissionHandler : IRequestHandler<GetCollaboratorPermissionQuery, AudioVerse.Domain.Enums.CollaborationPermission?>
    {
        private readonly IKaraokeRepository _repo;
        public GetCollaboratorPermissionHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<AudioVerse.Domain.Enums.CollaborationPermission?> Handle(GetCollaboratorPermissionQuery request, CancellationToken cancellationToken)
        {
            return await _repo.GetCollaboratorPermissionAsync(request.SongId, request.UserId);
        }
    }
}
