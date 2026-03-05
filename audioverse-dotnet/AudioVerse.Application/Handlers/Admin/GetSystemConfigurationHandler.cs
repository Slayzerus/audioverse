using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetSystemConfigurationHandler : IRequestHandler<GetSystemConfigurationQuery, SystemConfigurationDto>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;

        public GetSystemConfigurationHandler(ISystemConfigRepository systemConfigRepository)
        {
            _systemConfigRepository = systemConfigRepository;
        }

        public async Task<SystemConfigurationDto> Handle(GetSystemConfigurationQuery request, CancellationToken cancellationToken)
        {
            var activeConfig = await _systemConfigRepository.GetActiveConfigAsync();

            if (activeConfig == null)
                throw new Exception("No system configuration found. Make sure it has been seeded.");

            return new SystemConfigurationDto
            {
                Id = activeConfig.Id,
                SessionTimeoutMinutes = activeConfig.SessionTimeoutMinutes,
                CaptchaOption = activeConfig.CaptchaOption,
                MaxMicrophonePlayers = activeConfig.MaxMicrophonePlayers,
                Active = activeConfig.Active,
                ModifiedAt = activeConfig.ModifiedAt,
                ModifiedByUserId = activeConfig.ModifiedByUserId,
                ModifiedByUsername = activeConfig.ModifiedByUsername
            };
        }
    }
}
