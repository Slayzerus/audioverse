using MediatR;
using System.Collections.Generic;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record SetSongsInDevelopmentCommand(List<int> SongIds, bool InDevelopment) : IRequest<bool>;
}
