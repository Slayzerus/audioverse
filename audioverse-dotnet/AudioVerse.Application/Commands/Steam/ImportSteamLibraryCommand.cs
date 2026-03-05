using MediatR;

namespace AudioVerse.Application.Commands.Steam
{
    public record ImportSteamLibraryCommand(string SteamId) : IRequest<int>;
}
