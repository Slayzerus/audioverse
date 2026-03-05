using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record RemovePlaylistItemCommand(int Id) : IRequest<bool>;
}
