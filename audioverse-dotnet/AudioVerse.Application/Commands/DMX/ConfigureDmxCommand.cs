using MediatR;

namespace AudioVerse.Application.Commands.DMX
{
    public sealed record ConfigureDmxCommand(uint Fps, byte StartCode) : IRequest<Unit>;
}
