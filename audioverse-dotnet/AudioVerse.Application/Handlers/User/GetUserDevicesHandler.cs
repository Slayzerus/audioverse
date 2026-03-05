using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class GetUserDevicesHandler : IRequestHandler<GetUserDevicesQuery, List<DeviceDto>>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public GetUserDevicesHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<List<DeviceDto>> Handle(GetUserDevicesQuery request, CancellationToken cancellationToken)
        {
            var devices = await _userProfileRepository.GetDevicesByUserAsync(request.UserId);
            return devices
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new DeviceDto
                {
                    Id = d.Id,
                    DeviceId = d.DeviceId,
                    DeviceName = d.DeviceName,
                    UserDeviceName = d.UserDeviceName,
                    DeviceType = d.DeviceType,
                    Visible = d.Visible
                })
                .ToList();
        }
    }
}
