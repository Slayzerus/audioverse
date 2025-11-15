using MediatR;
using AudioVerse.Application.Services.DMX;
using AudioVerse.Application.Commands.DMX;

namespace AudioVerse.Application.Handlers.DMX
{
    public sealed class ConfigureDmxHandler : IRequestHandler<ConfigureDmxCommand, Unit>
    {
        private readonly DmxState _state;
        public ConfigureDmxHandler(DmxState state) => _state = state;

        public Task<Unit> Handle(ConfigureDmxCommand request, CancellationToken ct)
        {
            _state.Fps = (int)request.Fps;
            _state.StartCode = request.StartCode;
            return Task.FromResult(Unit.Value);
        }
    }
}
