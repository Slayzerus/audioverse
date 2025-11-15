using MediatR;

namespace AudioVerse.Application.Commands.DMX
{
    public sealed record SetChannelValueCommand(int Channel, byte Value) : IRequest<Unit>;
}
