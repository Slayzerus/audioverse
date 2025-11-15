using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record CreateKaraokePlayerCommand(KaraokePlayer Player) : IRequest<int>;
}
