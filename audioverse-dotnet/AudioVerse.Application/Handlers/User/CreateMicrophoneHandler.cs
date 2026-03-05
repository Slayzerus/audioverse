using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class CreateMicrophoneHandler : IRequestHandler<CreateMicrophoneCommand, int>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public CreateMicrophoneHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<int> Handle(CreateMicrophoneCommand request, CancellationToken cancellationToken)
        {
            var entity = new UserProfileMicrophone
            {
                UserId = request.UserId,
                DeviceId = request.DeviceId,
                Volume = request.Volume,
                Threshold = request.Threshold,
                Visible = request.Visible,
                CreatedAt = DateTime.UtcNow,
                // Clamp and assign new configuration fields
                MicGain = Math.Clamp(request.MicGain, 0, 24),
                MonitorEnabled = request.MonitorEnabled,
                MonitorVolume = Math.Clamp(request.MonitorVolume, 0, 200),
                PitchThreshold = Math.Clamp(request.PitchThreshold, 0.0, 1.0),
                SmoothingWindow = Math.Clamp(request.SmoothingWindow, 1, 20),
                HysteresisFrames = Math.Clamp(request.HysteresisFrames, 1, 20),
                RmsThreshold = Math.Clamp(request.RmsThreshold, 0.001, 0.1),
                UseHanning = request.UseHanning,
                PitchDetectionMethod = request.PitchDetectionMethod,
                OffsetMs = Math.Clamp(request.OffsetMs, -5000, 5000)
            };

            return await _userProfileRepository.CreateMicrophoneAsync(entity);
        }
    }
}
