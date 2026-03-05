using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record DeleteDeviceCommand(int DeviceRecordId, int UserId) : IRequest<bool>;
}
