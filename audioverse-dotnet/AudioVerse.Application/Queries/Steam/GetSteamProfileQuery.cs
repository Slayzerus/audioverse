using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamProfileQuery(string SteamId) : IRequest<SteamPlayerSummary?>;
}
