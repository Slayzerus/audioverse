using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record CreatePlaylistCommand(Playlist Playlist) : IRequest<int>;
}
