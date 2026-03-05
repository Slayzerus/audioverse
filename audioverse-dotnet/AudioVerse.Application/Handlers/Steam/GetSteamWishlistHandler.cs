using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamWishlistHandler : IRequestHandler<GetSteamWishlistQuery, List<SteamWishlistItem>>
    {
        private readonly ISteamClient _steam;
        public GetSteamWishlistHandler(ISteamClient steam) => _steam = steam;

        public async Task<List<SteamWishlistItem>> Handle(GetSteamWishlistQuery request, CancellationToken ct)
            => await _steam.GetWishlistAsync(request.SteamId, ct);
    }
}
