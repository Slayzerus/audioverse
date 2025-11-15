using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record SaveSingingResultsCommand(KaraokeSinging Singing) : IRequest<bool>;
}
