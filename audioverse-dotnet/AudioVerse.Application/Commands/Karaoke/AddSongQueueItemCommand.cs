using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddSongQueueItemCommand(KaraokeSongFileQueueItem Item) : IRequest<int>;
}
