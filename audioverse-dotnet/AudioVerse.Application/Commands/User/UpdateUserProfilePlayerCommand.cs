using AudioVerse.Domain.Entities.UserProfiles;
using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record UpdateUserProfilePlayerCommand(int PlayerId, int ProfileId, string Name, string PreferredColors, string FillPattern, bool IsMainPlayer, string? Email, string? Icon, KaraokeSettings? KaraokeSettings) : IRequest<bool>;
}
