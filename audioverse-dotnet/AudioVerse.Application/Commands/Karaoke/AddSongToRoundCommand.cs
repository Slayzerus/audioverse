using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddSongToRoundCommand(KaraokeSinging Singing) : IRequest<int>;
}
