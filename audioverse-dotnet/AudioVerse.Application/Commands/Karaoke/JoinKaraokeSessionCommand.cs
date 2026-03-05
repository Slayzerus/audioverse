using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record JoinKaraokeSessionCommand(int SessionId, int? UserId, string? Code) : IRequest<bool>;
}
