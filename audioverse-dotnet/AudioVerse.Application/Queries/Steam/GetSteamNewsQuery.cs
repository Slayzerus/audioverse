using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record GetSteamNewsQuery(int AppId, int Count = 10) : IRequest<List<SteamNewsItem>>;
}
