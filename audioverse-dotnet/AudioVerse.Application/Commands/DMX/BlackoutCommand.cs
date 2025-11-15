using MediatR;

namespace AudioVerse.Application.Commands.DMX
{
    public sealed record BlackoutCommand() : IRequest<Unit>;
}
