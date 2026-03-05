using MediatR;
using System.Collections.Generic;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record SetSongsVerifiedCommand(List<int> SongIds, bool IsVerified) : IRequest<bool>;
}
