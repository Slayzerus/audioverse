using MediatR;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetCollaboratorPermissionQuery(int SongId, int UserId) : IRequest<CollaborationPermission?>;
}
