using MediatR;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddCollaboratorCommand(int SongId, int UserId, CollaborationPermission Permission = CollaborationPermission.Read) : IRequest<bool>;
}
