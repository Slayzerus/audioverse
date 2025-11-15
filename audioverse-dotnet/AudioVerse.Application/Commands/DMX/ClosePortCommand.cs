using MediatR;

namespace AudioVerse.Application.Commands.DMX
{
    public sealed record ClosePortCommand() : IRequest<Unit>;
}
