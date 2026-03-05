using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamRecentGamesHandler : IRequestHandler<GetSteamRecentGamesQuery, List<SteamRecentGame>>
    {
        private readonly ISteamClient _steam;
        public GetSteamRecentGamesHandler(ISteamClient steam) => _steam = steam;

        public async Task<List<SteamRecentGame>> Handle(GetSteamRecentGamesQuery request, CancellationToken ct)
            => await _steam.GetRecentlyPlayedGamesAsync(request.SteamId, request.Count, ct);
    }
}
