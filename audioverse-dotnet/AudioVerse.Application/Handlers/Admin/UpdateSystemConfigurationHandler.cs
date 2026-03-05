using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class UpdateSystemConfigurationHandler : IRequestHandler<UpdateSystemConfigurationCommand, bool>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;

        public UpdateSystemConfigurationHandler(ISystemConfigRepository systemConfigRepository)
        {
            _systemConfigRepository = systemConfigRepository;
        }

        public async Task<bool> Handle(UpdateSystemConfigurationCommand request, CancellationToken cancellationToken)
        {
            var newConfig = new SystemConfiguration
            {
                SessionTimeoutMinutes = request.SessionTimeoutMinutes,
                CaptchaOption = request.CaptchaOption,
                MaxMicrophonePlayers = request.MaxMicrophonePlayers,
                Active = request.Active,
                ModifiedAt = DateTime.UtcNow,
                ModifiedByUserId = request.ModifiedByUserId,
                ModifiedByUsername = request.ModifiedByUsername
            };

            await _systemConfigRepository.CreateConfigAsync(newConfig);
            return true;
        }
    }
}
