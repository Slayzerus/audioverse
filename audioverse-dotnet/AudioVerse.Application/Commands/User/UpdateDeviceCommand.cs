using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record UpdateDeviceCommand(int DeviceRecordId, int UserId, string DeviceId, string DeviceName, string UserDeviceName, DeviceType DeviceType, bool Visible) : IRequest<bool>;
}
