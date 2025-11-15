using MediatR;
using AudioVerse.Application.Services.DMX;
using AudioVerse.Application.Commands.DMX;

namespace AudioVerse.Application.Handlers.DMX
{
    public sealed class SetChannelValueHandler : IRequestHandler<SetChannelValueCommand, Unit>
    {
        private readonly DmxState _state;
        public SetChannelValueHandler(DmxState state) => _state = state;

        public Task<Unit> Handle(SetChannelValueCommand request, CancellationToken ct)
        {
            _state.SetChannel(request.Channel, request.Value);
            return Task.FromResult(Unit.Value);
        }
    }
}
