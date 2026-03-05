using FluentValidation;
using AudioVerse.Application.Models.Requests.User;

namespace AudioVerse.Application.Validators.User
{
    public class CreateMicrophoneRequestValidator : AbstractValidator<CreateMicrophoneRequest>
    {
        public CreateMicrophoneRequestValidator()
        {
            RuleFor(x => x.DeviceId).NotEmpty().WithMessage("DeviceId is required");
            RuleFor(x => x.Volume).InclusiveBetween(0, 200);
            RuleFor(x => x.Threshold).GreaterThanOrEqualTo(0);
            RuleFor(x => x.MicGain).InclusiveBetween(0, 24);
            RuleFor(x => x.MonitorVolume).InclusiveBetween(0, 200);
            RuleFor(x => x.PitchThreshold).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.SmoothingWindow).InclusiveBetween(1, 20);
            RuleFor(x => x.HysteresisFrames).InclusiveBetween(1, 20);
            RuleFor(x => x.RmsThreshold).InclusiveBetween(0.001, 0.1);
            RuleFor(x => x.PitchDetectionMethod).IsInEnum();
            RuleFor(x => x.OffsetMs).InclusiveBetween(-5000, 5000);
        }
    }
}
