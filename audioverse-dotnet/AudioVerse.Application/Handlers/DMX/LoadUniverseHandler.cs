using MediatR;
using AudioVerse.Application.Services.DMX;
using AudioVerse.Application.Commands.DMX;

namespace AudioVerse.Application.Handler.DMX
{
    public sealed class LoadUniverseHandler : IRequestHandler<LoadUniverseCommand, Unit>
    {
        private readonly DmxState _state;
        public LoadUniverseHandler(DmxState state) => _state = state;

        public Task<Unit> Handle(LoadUniverseCommand request, CancellationToken ct)
        {
            if (request.Payload512 is null || request.Payload512.Length != 512)
                throw new System.ArgumentException("Payload must be 512 bytes");
            _state.LoadUniverse(request.Payload512);
            return Task.FromResult(Unit.Value);
        }
    }
}
