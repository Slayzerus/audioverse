using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamRecentGamesQuery(string SteamId, int Count = 10) : IRequest<List<SteamRecentGame>>;
}
