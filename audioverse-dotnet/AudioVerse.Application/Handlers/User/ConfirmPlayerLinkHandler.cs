using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Models.Dtos;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    /// <summary>
    /// Tworzy link między graczem źródłowym a docelowym z innego profilu.
    /// Zapobiega duplikatom i linkowaniu graczy z tego samego profilu.
    /// </summary>
    public class ConfirmPlayerLinkHandler : IRequestHandler<ConfirmPlayerLinkCommand, PlayerLinkDto?>
    {
        private readonly IUserProfileRepository _repo;

        public ConfirmPlayerLinkHandler(IUserProfileRepository repo)
        {
            _repo = repo;
        }

        public async Task<PlayerLinkDto?> Handle(ConfirmPlayerLinkCommand request, CancellationToken cancellationToken)
        {
            var sourcePlayer = await _repo.GetPlayerByIdAsync(request.SourcePlayerId);
            if (sourcePlayer == null || sourcePlayer.ProfileId != request.SourceProfileId)
                return null;

            var targetPlayer = await _repo.GetPlayerByIdAsync(request.TargetPlayerId);
            if (targetPlayer == null)
                return null;

            if (sourcePlayer.ProfileId == targetPlayer.ProfileId)
                return null;

            var existingLink = await _repo.GetActivePlayerLinkAsync(request.SourcePlayerId, request.TargetPlayerId, cancellationToken);
            if (existingLink != null)
                return null;

            var link = new PlayerLink
            {
                SourcePlayerId = request.SourcePlayerId,
                TargetPlayerId = request.TargetPlayerId,
                Scope = request.Scope,
                Status = PlayerLinkStatus.Active
            };

            await _repo.AddPlayerLinkAsync(link, cancellationToken);

            return new PlayerLinkDto
            {
                Id = link.Id,
                SourcePlayerId = sourcePlayer.Id,
                SourcePlayerName = sourcePlayer.Name,
                SourceProfileId = sourcePlayer.ProfileId,
                TargetPlayerId = targetPlayer.Id,
                TargetPlayerName = targetPlayer.Name,
                TargetProfileId = targetPlayer.ProfileId,
                Scope = link.Scope,
                Status = link.Status,
                CreatedAt = link.CreatedAt
            };
        }
    }
}
