using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record UpdateRoundPlayerMicCommand(int RoundId, int AssignmentId, string? MicDeviceId) : IRequest<bool>;
}
