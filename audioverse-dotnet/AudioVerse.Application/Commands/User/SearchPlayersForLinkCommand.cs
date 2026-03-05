using AudioVerse.Application.Models.Dtos;
using MediatR;

namespace AudioVerse.Application.Commands.User
{
    /// <summary>
    /// Wyszukanie graczy z innego profilu po uwierzytelnieniu credentials (krok 1 link flow).
    /// </summary>
    public record SearchPlayersForLinkCommand(int SourcePlayerId, int SourceProfileId, string Login, string Password)
        : IRequest<List<LinkCandidatePlayerDto>>;
}
