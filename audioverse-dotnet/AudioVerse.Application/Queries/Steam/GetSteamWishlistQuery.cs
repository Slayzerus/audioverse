using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamWishlistQuery(string SteamId) : IRequest<List<SteamWishlistItem>>;
}
