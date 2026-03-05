using MediatR;

namespace AudioVerse.Application.Commands.User
{
    /// <summary>
    /// Cofnięcie (revoke) linku między graczami.
    /// </summary>
    public record RevokePlayerLinkCommand(int LinkId, int ProfileId) : IRequest<bool>;
}
