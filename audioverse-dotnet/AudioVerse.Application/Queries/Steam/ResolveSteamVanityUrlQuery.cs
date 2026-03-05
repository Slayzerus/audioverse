using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Queries.Steam
{
    public record ResolveSteamVanityUrlQuery(string VanityName) : IRequest<string?>;
}
