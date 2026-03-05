using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamOwnedGamesQuery(string SteamId, bool IncludeFreeGames = false) : IRequest<List<SteamOwnedGame>>;
}
