using AudioVerse.Domain.Entities.Dmx;
using MediatR;

namespace AudioVerse.Application.Queries.DMX
{
    public sealed record ListFtdiDevicesQuery() : IRequest<IReadOnlyList<FtdiDeviceDto>>;
    public sealed record FtdiDeviceDto(string SerialNumber, string Description, uint LocId, DmxDeviceInfo device);
}
