using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record AddPlaylistItemCommand(int PlaylistId, int SongId, int OrderNumber) : IRequest<int>;
}
