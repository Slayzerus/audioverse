using AudioVerse.Application.Queries.DMX;
using AudioVerse.Domain.Entities.Dmx;
using MediatR;
using System.Text;
using FT = AudioVerse.Infrastructure.DMX.FtdiD2xx;

namespace AudioVerse.Application.Handlers.DMX
{
    public sealed class ListFtdiDevicesHandler : IRequestHandler<ListFtdiDevicesQuery, IReadOnlyList<FtdiDeviceDto>>
    {
        public Task<IReadOnlyList<FtdiDeviceDto>> Handle(ListFtdiDevicesQuery request, CancellationToken ct)
        {
            var list = new List<FtdiDeviceDto>();
            FT.Check(FT.FT_CreateDeviceInfoList(out var n), "FT_CreateDeviceInfoList");
            for (uint i = 0; i < n; i++)
            {
                var sn = new StringBuilder(16);
                var desc = new StringBuilder(64);
                FT.Check(FT.FT_GetDeviceInfoDetail(i, out var flags, out var type, out var id, out var loc, sn, desc, out var handle), "FT_GetDeviceInfoDetail");
                list.Add(new FtdiDeviceDto(sn.ToString(), desc.ToString(), loc, DmxDeviceInfo.Light4MeEventIvV2_17ch));
            }
            return Task.FromResult((IReadOnlyList<FtdiDeviceDto>)list);
        }
    }
}
