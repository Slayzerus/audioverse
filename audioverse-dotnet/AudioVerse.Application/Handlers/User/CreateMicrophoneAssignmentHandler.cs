using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class CreateMicrophoneAssignmentHandler : IRequestHandler<CreateMicrophoneAssignmentCommand, int>
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ISystemConfigRepository _systemConfigRepository;

        public CreateMicrophoneAssignmentHandler(IUserProfileRepository userProfileRepository, ISystemConfigRepository systemConfigRepository)
        {
            _userProfileRepository = userProfileRepository;
            _systemConfigRepository = systemConfigRepository;
        }

        public async Task<int> Handle(CreateMicrophoneAssignmentCommand request, CancellationToken cancellationToken)
        {
            // Enforce slot range using system configuration (default 4 if not found)
            var config = await _systemConfigRepository.GetActiveConfigAsync();
            var maxSlots = config?.MaxMicrophonePlayers ?? 4;
            if (request.Slot < 0 || request.Slot >= maxSlots)
                throw new Exception($"Slot {request.Slot} exceeds allowed range 0..{maxSlots - 1}");

            var entity = new MicrophoneAssignment
            {
                UserId = request.UserId,
                MicrophoneId = request.MicrophoneId,
                Color = request.Color,
                Slot = request.Slot,
                AssignedAt = DateTime.UtcNow
            };

            return await _userProfileRepository.CreateMicrophoneAssignmentAsync(entity);
        }
    }
}
