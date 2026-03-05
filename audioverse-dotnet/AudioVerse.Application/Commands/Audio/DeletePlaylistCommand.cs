using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record DeletePlaylistCommand(int Id) : IRequest<bool>;
}
