using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class UpdateMicrophoneAssignmentHandler : IRequestHandler<UpdateMicrophoneAssignmentCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ISystemConfigRepository _systemConfigRepository;

        public UpdateMicrophoneAssignmentHandler(IUserProfileRepository userProfileRepository, ISystemConfigRepository systemConfigRepository)
        {
            _userProfileRepository = userProfileRepository;
            _systemConfigRepository = systemConfigRepository;
        }

        public async Task<bool> Handle(UpdateMicrophoneAssignmentCommand request, CancellationToken cancellationToken)
        {
            var entity = await _userProfileRepository.GetMicrophoneAssignmentByIdAsync(request.AssignmentId);
            if (entity == null || entity.UserId != request.UserId)
                return false;

            // validate slot with config (default 4)
            var config = await _systemConfigRepository.GetActiveConfigAsync();
            var maxSlots = config?.MaxMicrophonePlayers ?? 4;
            if (request.Slot < 0 || request.Slot >= maxSlots)
                throw new Exception($"Slot {request.Slot} exceeds allowed range 0..{maxSlots - 1}");

            entity.Color = request.Color;
            entity.Slot = request.Slot;
            entity.AssignedAt = DateTime.UtcNow;

            return await _userProfileRepository.UpdateMicrophoneAssignmentAsync(entity);
        }
    }
}
