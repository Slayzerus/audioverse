using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamNewsHandler : IRequestHandler<GetSteamNewsQuery, List<SteamNewsItem>>
    {
        private readonly ISteamClient _steam;
        public GetSteamNewsHandler(ISteamClient steam) => _steam = steam;

        public async Task<List<SteamNewsItem>> Handle(GetSteamNewsQuery request, CancellationToken ct)
            => await _steam.GetNewsForAppAsync(request.AppId, request.Count, ct: ct);
    }
}
