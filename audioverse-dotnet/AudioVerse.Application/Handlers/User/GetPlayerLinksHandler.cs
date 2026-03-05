using AudioVerse.Application.Models.Dtos;
using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    /// <summary>
    /// Pobranie wszystkich aktywnych linków gracza (incoming + outgoing).
    /// </summary>
    public class GetPlayerLinksHandler : IRequestHandler<GetPlayerLinksQuery, List<PlayerLinkDto>>
    {
        private readonly IUserProfileRepository _repo;

        public GetPlayerLinksHandler(IUserProfileRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<PlayerLinkDto>> Handle(GetPlayerLinksQuery request, CancellationToken cancellationToken)
        {
            var player = await _repo.GetPlayerByIdAsync(request.PlayerId);
            if (player == null || player.ProfileId != request.ProfileId)
                return [];

            var links = (await _repo.GetPlayerLinksForProfileAsync(player.ProfileId, cancellationToken))
                .Where(l => l.Status == PlayerLinkStatus.Active &&
                    (l.SourcePlayerId == request.PlayerId || l.TargetPlayerId == request.PlayerId))
                .OrderByDescending(l => l.CreatedAt)
                .ToList();

            return links.Select(l => new PlayerLinkDto
            {
                Id = l.Id,
                SourcePlayerId = l.SourcePlayerId,
                SourcePlayerName = l.SourcePlayer?.Name ?? string.Empty,
                SourceProfileId = l.SourcePlayer?.ProfileId ?? 0,
                TargetPlayerId = l.TargetPlayerId,
                TargetPlayerName = l.TargetPlayer?.Name ?? string.Empty,
                TargetProfileId = l.TargetPlayer?.ProfileId ?? 0,
                Scope = l.Scope,
                Status = l.Status,
                CreatedAt = l.CreatedAt
            }).ToList();
        }
    }
}
