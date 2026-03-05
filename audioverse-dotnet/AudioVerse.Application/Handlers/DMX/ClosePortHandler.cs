using MediatR;
using AudioVerse.Application.Services.DMX;
using AudioVerse.Application.Commands.DMX;

namespace AudioVerse.Application.Handlers.DMX
{
    public sealed class ClosePortHandler : IRequestHandler<ClosePortCommand, Unit>
    {
        private readonly IDmxPort _port;
        public ClosePortHandler(IDmxPort port) => _port = port;

        public Task<Unit> Handle(OpenPortCommand request, CancellationToken ct)
        {
            if (_port.IsOpen) _port.Close();
            _port.Open(request.SerialOrDescription);
            return Task.FromResult(Unit.Value);
        }

        public Task<Unit> Handle(ClosePortCommand request, CancellationToken ct)
        {
            _port.Close();
            return Task.FromResult(Unit.Value);
        }
    }
}
