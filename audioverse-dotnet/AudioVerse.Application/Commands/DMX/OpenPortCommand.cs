using MediatR;

namespace AudioVerse.Application.Commands.DMX
{
    public sealed record OpenPortCommand(string? SerialOrDescription) : IRequest<Unit>;
}
