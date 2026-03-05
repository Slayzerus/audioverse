using AudioVerse.Application.Commands.Steam;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Steam;

public class LinkSteamAccountHandler(IExternalAccountRepository repo) : IRequestHandler<LinkSteamAccountCommand, bool>
{
    public async Task<bool> Handle(LinkSteamAccountCommand req, CancellationToken ct)
    {
        var existing = await repo.GetByPlatformAsync(req.UserId, ExternalPlatform.Steam);
        if (existing != null)
        {
            await repo.UnlinkAccountAsync(req.UserId, ExternalPlatform.Steam);
        }

        await repo.LinkAccountAsync(new UserExternalAccount
        {
            UserProfileId = req.UserId,
            Platform = ExternalPlatform.Steam,
            ExternalUserId = req.SteamId,
            LinkedAt = DateTime.UtcNow
        });
        return true;
    }
}
