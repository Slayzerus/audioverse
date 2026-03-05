using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record UpdateSongQueueItemStatusCommand(int Id, SongQueueStatus Status) : IRequest<bool>;
}
