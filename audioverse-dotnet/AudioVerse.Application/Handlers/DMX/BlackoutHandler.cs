using MediatR;
using AudioVerse.Application.Services.DMX;

namespace AudioVerse.Application.Commands.DMX
{
    public sealed class BlackoutHandler : IRequestHandler<BlackoutCommand, Unit>
    {
        private readonly DmxState _state;
        public BlackoutHandler(DmxState state) => _state = state;
        public Task<Unit> Handle(BlackoutCommand request, CancellationToken ct)
        {
            _state.Blackout();
            return Task.FromResult(Unit.Value);
        }
    }
}
