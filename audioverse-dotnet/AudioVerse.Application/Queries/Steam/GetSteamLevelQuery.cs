using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamLevelQuery(string SteamId) : IRequest<int?>;
}
