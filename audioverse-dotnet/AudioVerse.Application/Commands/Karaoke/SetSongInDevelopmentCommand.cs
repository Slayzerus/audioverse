using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record SetSongInDevelopmentCommand(int SongId, bool InDevelopment) : IRequest<bool>;
}
