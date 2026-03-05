using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RevokePermissionCommand(int EventId, int PlayerId, EventPermission Permission, int RevokedByUserId) : IRequest<bool>;
}
