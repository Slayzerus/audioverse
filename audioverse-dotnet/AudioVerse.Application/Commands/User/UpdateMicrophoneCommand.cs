using MediatR;

namespace AudioVerse.Application.Commands.User
{
public record UpdateMicrophoneCommand(
    int MicrophoneRecordId,
    int UserId,
    string DeviceId,
    int Volume,
    int Threshold,
    bool Visible,
    int MicGain,
    bool MonitorEnabled,
    int MonitorVolume,
    double PitchThreshold,
    int SmoothingWindow,
    int HysteresisFrames,
    double RmsThreshold,
    bool UseHanning
    , AudioVerse.Domain.Enums.PitchDetectionMethod PitchDetectionMethod
    , int OffsetMs
) : IRequest<bool>;
}
