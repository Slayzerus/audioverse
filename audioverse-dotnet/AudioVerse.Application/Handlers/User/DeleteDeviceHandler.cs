using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class DeleteDeviceHandler : IRequestHandler<DeleteDeviceCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public DeleteDeviceHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<bool> Handle(DeleteDeviceCommand request, CancellationToken cancellationToken)
        {
            var device = await _userProfileRepository.GetDeviceByIdAsync(request.DeviceRecordId);
            if (device == null || device.UserId != request.UserId)
                return false;

            return await _userProfileRepository.DeleteDeviceAsync(request.DeviceRecordId);
        }
    }
}
