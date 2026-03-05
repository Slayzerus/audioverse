using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddFavoriteSongCommand(int PlayerId, int SongId) : IRequest<int>;
}
