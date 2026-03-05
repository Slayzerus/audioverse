using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record SetSongVerifiedCommand(int SongId, bool IsVerified) : IRequest<bool>;
}
