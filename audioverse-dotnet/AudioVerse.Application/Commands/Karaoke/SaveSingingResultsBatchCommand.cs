using MediatR;
using System.Collections.Generic;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record SaveSingingResultsBatchCommand(IEnumerable<SaveSingingResultsCommand> Results) : IRequest<bool>;
}
