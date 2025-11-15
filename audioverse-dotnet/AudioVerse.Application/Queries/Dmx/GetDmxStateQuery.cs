using MediatR;

namespace AudioVerse.Application.Queries.DMX
{
    public sealed record GetDmxStateQuery() : IRequest<DmxStateDto>;

    public sealed record DmxStateDto(uint Fps, byte StartCode, byte[] FrontSnapshot);
}
