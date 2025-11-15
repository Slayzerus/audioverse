using AudioVerse.Application.Queries.DMX;
using AudioVerse.Application.Services.DMX;
using MediatR;

namespace AudioVerse.Application.Handlers.DMX
{
    public sealed class GetDmxStateHandler : IRequestHandler<GetDmxStateQuery, DmxStateDto>
    {
        private readonly DmxState _state;
        public GetDmxStateHandler(DmxState state) => _state = state;

        public Task<DmxStateDto> Handle(GetDmxStateQuery request, CancellationToken ct)
        {
            var dto = new DmxStateDto((uint)_state.Fps, _state.StartCode, _state.Snapshot());
            return Task.FromResult(dto);
        }
    }
}
