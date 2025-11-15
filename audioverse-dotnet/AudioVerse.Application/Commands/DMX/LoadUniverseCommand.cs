using MediatR;

namespace AudioVerse.Application.Commands.DMX
{
    public sealed record LoadUniverseCommand(byte[] Payload512) : IRequest<Unit>;
}
