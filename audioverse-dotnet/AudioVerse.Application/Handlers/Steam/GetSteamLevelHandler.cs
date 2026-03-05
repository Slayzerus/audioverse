using AudioVerse.Application.Queries.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamLevelHandler : IRequestHandler<GetSteamLevelQuery, int?>
    {
        private readonly Infrastructure.ExternalApis.Steam.ISteamClient _steam;
        public GetSteamLevelHandler(Infrastructure.ExternalApis.Steam.ISteamClient steam) => _steam = steam;

        public async Task<int?> Handle(GetSteamLevelQuery request, CancellationToken ct)
            => await _steam.GetSteamLevelAsync(request.SteamId, ct);
    }
}
