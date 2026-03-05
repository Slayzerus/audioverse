using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam
{
    public class GetSteamFriendsHandler : IRequestHandler<GetSteamFriendsQuery, List<SteamFriend>>
    {
        private readonly ISteamClient _steam;
        public GetSteamFriendsHandler(ISteamClient steam) => _steam = steam;

        public async Task<List<SteamFriend>> Handle(GetSteamFriendsQuery request, CancellationToken ct)
            => await _steam.GetFriendListAsync(request.SteamId, ct);
    }
}
