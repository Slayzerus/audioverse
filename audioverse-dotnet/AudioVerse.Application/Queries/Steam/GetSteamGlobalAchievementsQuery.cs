using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamGlobalAchievementsQuery(int AppId) : IRequest<List<SteamGlobalAchievement>>;
}
