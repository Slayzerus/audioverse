using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record UpdatePlaylistCommand(Playlist Playlist) : IRequest<bool>;
}
