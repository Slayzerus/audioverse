using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record RevertSongVersionCommand(int SongId, int Version, int? ChangedByUserId = null, string? Reason = null) : IRequest<bool>;
}
