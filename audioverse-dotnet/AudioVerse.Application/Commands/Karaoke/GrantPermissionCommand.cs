using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record GrantPermissionCommand(int EventId, int PlayerId, EventPermission Permission, int GrantedByUserId) : IRequest<bool>;
}
