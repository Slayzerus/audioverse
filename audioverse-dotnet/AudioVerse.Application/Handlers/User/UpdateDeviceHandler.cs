using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class UpdateDeviceHandler : IRequestHandler<UpdateDeviceCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public UpdateDeviceHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<bool> Handle(UpdateDeviceCommand request, CancellationToken cancellationToken)
        {
            var existing = await _userProfileRepository.GetDeviceByIdAsync(request.DeviceRecordId);
            if (existing == null || existing.UserId != request.UserId)
                return false;

            existing.DeviceId = request.DeviceId;
            existing.DeviceName = request.DeviceName;
            existing.UserDeviceName = request.UserDeviceName;
            existing.DeviceType = request.DeviceType;
            existing.Visible = request.Visible;

            return await _userProfileRepository.UpdateDeviceAsync(existing);
        }
    }
}
