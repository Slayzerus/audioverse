using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    /// <summary>
    /// Cofnięcie linku — zmiana statusu na Revoked.
    /// Dozwolone tylko przez właściciela jednego z powiązanych graczy.
    /// </summary>
    public class RevokePlayerLinkHandler : IRequestHandler<RevokePlayerLinkCommand, bool>
    {
        private readonly IUserProfileRepository _repo;

        public RevokePlayerLinkHandler(IUserProfileRepository repo)
        {
            _repo = repo;
        }

        public async Task<bool> Handle(RevokePlayerLinkCommand request, CancellationToken cancellationToken)
        {
            return await _repo.RevokePlayerLinkAsync(request.LinkId, request.ProfileId, cancellationToken);
        }
    }
}
