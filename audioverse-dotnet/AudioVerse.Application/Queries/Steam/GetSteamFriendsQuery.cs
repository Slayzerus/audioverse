using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamFriendsQuery(string SteamId) : IRequest<List<SteamFriend>>;
}
