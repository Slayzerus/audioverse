using MediatR;
using AudioVerse.Application.Services.DMX;
using AudioVerse.Application.Commands.DMX;

namespace AudioVerse.Application.Handlers.DMX
{
    public sealed class OpenPortHandler : IRequestHandler<OpenPortCommand, Unit>
    {
        private readonly IDmxPort _port;
        public OpenPortHandler(IDmxPort port) => _port = port;

        public Task<Unit> Handle(OpenPortCommand request, CancellationToken ct)
        {
            if (_port.IsOpen) _port.Close();
            _port.Open(request.SerialOrDescription);
            return Task.FromResult(Unit.Value);
        }
    }
}
