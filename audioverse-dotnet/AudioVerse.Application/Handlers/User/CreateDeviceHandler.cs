using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class CreateDeviceHandler : IRequestHandler<CreateDeviceCommand, int>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public CreateDeviceHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<int> Handle(CreateDeviceCommand request, CancellationToken cancellationToken)
        {
            var entity = new UserProfileDevice
            {
                UserId = request.UserId,
                DeviceId = request.DeviceId,
                DeviceName = request.DeviceName,
                UserDeviceName = request.UserDeviceName,
                DeviceType = request.DeviceType,
                Visible = request.Visible,
                CreatedAt = DateTime.UtcNow
            };

            return await _userProfileRepository.CreateDeviceAsync(entity);
        }
    }
}
