using MediatR;

namespace AudioVerse.Application.Commands.Steam
{
    public record LinkSteamAccountCommand(int UserId, string SteamId) : IRequest<bool>;
}
