using AudioVerse.Application.Queries.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam;

public class ResolveSteamVanityUrlHandler(ISteamClient client) : IRequestHandler<ResolveSteamVanityUrlQuery, string?>
{
    public Task<string?> Handle(ResolveSteamVanityUrlQuery req, CancellationToken ct)
        => client.ResolveVanityUrlAsync(req.VanityName, ct);
}
