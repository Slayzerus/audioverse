using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamOwnedGamesHandler : IRequestHandler<GetSteamOwnedGamesQuery, List<SteamOwnedGame>>
    {
        private readonly ISteamClient _steam;
        public GetSteamOwnedGamesHandler(ISteamClient steam) => _steam = steam;

        public async Task<List<SteamOwnedGame>> Handle(GetSteamOwnedGamesQuery request, CancellationToken ct)
            => await _steam.GetOwnedGamesAsync(request.SteamId, includeFreeGames: request.IncludeFreeGames, ct: ct);
    }
}
