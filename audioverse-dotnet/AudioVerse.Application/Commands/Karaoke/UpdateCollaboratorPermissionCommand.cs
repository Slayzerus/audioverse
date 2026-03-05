using MediatR;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record UpdateCollaboratorPermissionCommand(int SongId, int UserId, CollaborationPermission Permission) : IRequest<bool>;
}
