using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.Admin
{
    public record UpdateSystemConfigurationCommand(
        int SessionTimeoutMinutes,
        CaptchaOption CaptchaOption,
        int MaxMicrophonePlayers,
        int? ModifiedByUserId,
        string? ModifiedByUsername,
        bool Active = true
    ) : IRequest<bool>;
}
