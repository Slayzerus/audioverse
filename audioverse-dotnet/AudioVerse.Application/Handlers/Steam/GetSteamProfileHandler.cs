using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamProfileHandler : IRequestHandler<GetSteamProfileQuery, SteamPlayerSummary?>
    {
        private readonly ISteamClient _steam;
        public GetSteamProfileHandler(ISteamClient steam) => _steam = steam;

        public async Task<SteamPlayerSummary?> Handle(GetSteamProfileQuery request, CancellationToken ct)
            => await _steam.GetPlayerSummaryAsync(request.SteamId, ct);
    }
}
