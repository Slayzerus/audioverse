using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RemoveSongQueueItemCommand(int Id) : IRequest<bool>;
}
