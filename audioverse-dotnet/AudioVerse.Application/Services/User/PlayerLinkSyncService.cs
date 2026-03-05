using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Services.User
{
    /// <summary>
    /// Propaguje zmiany do zlinkowanych graczy w ramach zdefiniowanego zakresu (Appearance, KaraokeSettings).
    /// Progress (historia śpiewania) jest synchronizowany osobno w KaraokeSinging handlerach.
    /// </summary>
    public class PlayerLinkSyncService : IPlayerLinkSyncService
    {
        private readonly IUserProfileRepository _repo;

        public PlayerLinkSyncService(IUserProfileRepository repo)
        {
            _repo = repo;
        }

        public async Task SyncLinkedPlayersAsync(int playerId)
        {
            var sourcePlayer = await _repo.GetPlayerByIdAsync(playerId);
            if (sourcePlayer == null)
                return;

            var links = (await _repo.GetPlayerLinksForProfileAsync(sourcePlayer.ProfileId))
                .Where(l => l.Status == PlayerLinkStatus.Active &&
                    (l.SourcePlayerId == playerId || l.TargetPlayerId == playerId))
                .ToList();

            if (links.Count == 0)
                return;

            var linkedPlayerIds = links
                .Select(l => l.SourcePlayerId == playerId ? l.TargetPlayerId : l.SourcePlayerId)
                .Distinct();

            foreach (var linkedId in linkedPlayerIds)
            {
                var target = await _repo.GetPlayerByIdAsync(linkedId);
                if (target == null) continue;

                var link = links.First(l =>
                    (l.SourcePlayerId == playerId && l.TargetPlayerId == target.Id) ||
                    (l.TargetPlayerId == playerId && l.SourcePlayerId == target.Id));

                if (link.Scope.HasFlag(PlayerLinkScope.Appearance))
                {
                    target.PreferredColors = sourcePlayer.PreferredColors;
                    target.FillPattern = sourcePlayer.FillPattern;
                }

                if (link.Scope.HasFlag(PlayerLinkScope.KaraokeSettings))
                {
                    target.KaraokeSettings = sourcePlayer.KaraokeSettings;
                }

                await _repo.UpdatePlayerAsync(target);
            }
        }
    }
}
