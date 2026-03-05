using AudioVerse.Application.Commands.Steam;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam;

public class ImportSteamLibraryHandler(ISteamClient client) : IRequestHandler<ImportSteamLibraryCommand, int>
{
    public async Task<int> Handle(ImportSteamLibraryCommand req, CancellationToken ct)
    {
        var games = await client.GetOwnedGamesAsync(req.SteamId, includeAppInfo: true, ct: ct);
        return games.Count;
    }
}
