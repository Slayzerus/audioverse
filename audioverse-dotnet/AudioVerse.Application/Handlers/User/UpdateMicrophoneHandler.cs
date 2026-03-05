using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class UpdateMicrophoneHandler : IRequestHandler<UpdateMicrophoneCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public UpdateMicrophoneHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<bool> Handle(UpdateMicrophoneCommand request, CancellationToken cancellationToken)
        {
            var entity = await _userProfileRepository.GetMicrophoneByIdAsync(request.MicrophoneRecordId);
            if (entity == null || entity.UserId != request.UserId)
                return false;

            entity.DeviceId = request.DeviceId;
            entity.Volume = request.Volume;
            entity.Threshold = request.Threshold;
            entity.Visible = request.Visible;
            // Update new microphone configuration fields
            entity.MicGain = Math.Clamp(request.MicGain, 0, 24);
            entity.MonitorEnabled = request.MonitorEnabled;
            entity.MonitorVolume = Math.Clamp(request.MonitorVolume, 0, 200);
            entity.PitchThreshold = Math.Clamp(request.PitchThreshold, 0.0, 1.0);
            entity.SmoothingWindow = Math.Clamp(request.SmoothingWindow, 1, 20);
            entity.HysteresisFrames = Math.Clamp(request.HysteresisFrames, 1, 20);
            entity.RmsThreshold = Math.Clamp(request.RmsThreshold, 0.001, 0.1);
            entity.UseHanning = request.UseHanning;
            entity.PitchDetectionMethod = request.PitchDetectionMethod;
            entity.OffsetMs = Math.Clamp(request.OffsetMs, -5000, 5000);
            entity.UpdatedAt = DateTime.UtcNow;

            return await _userProfileRepository.UpdateMicrophoneAsync(entity);
        }
    }
}
