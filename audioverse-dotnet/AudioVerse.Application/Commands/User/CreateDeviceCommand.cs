using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record CreateDeviceCommand(int UserId, string DeviceId, string DeviceName, string UserDeviceName, DeviceType DeviceType, bool Visible) : IRequest<int>;
}
