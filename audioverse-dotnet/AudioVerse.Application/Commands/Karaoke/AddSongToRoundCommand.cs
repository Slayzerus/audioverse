using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record AddSongToRoundCommand(KaraokeSinging Singing) : IRequest<int>;
}
