using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RemoveFavoriteSongCommand(int PlayerId, int SongId) : IRequest<bool>;
}
