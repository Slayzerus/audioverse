using FluentValidation;
using AudioVerse.Application.Models.Requests.User;

namespace AudioVerse.Application.Validators.User
{
    public class UpdateDeviceRequestValidator : AbstractValidator<UpdateDeviceRequest>
    {
        public UpdateDeviceRequestValidator()
        {
            RuleFor(x => x.DeviceId).NotEmpty().WithMessage("DeviceId is required");
            RuleFor(x => x.DeviceId).MaximumLength(128);
            RuleFor(x => x.DeviceName).MaximumLength(200);
            RuleFor(x => x.UserDeviceName).MaximumLength(200);
        }
    }
}
