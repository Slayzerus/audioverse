using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RemovePlayerFromKaraokeSessionCommand(int SessionId, int PlayerId) : IRequest<bool>;
}
