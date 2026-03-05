using FluentValidation;
using AudioVerse.Application.Models.Requests.Karaoke;

namespace AudioVerse.Application.Validators.Karaoke
{
    public class AddRoundPlayerRequestValidator : AbstractValidator<AddRoundPlayerRequest>
    {
        public AddRoundPlayerRequestValidator()
        {
            RuleFor(x => x.PlayerId).GreaterThan(0);
            RuleFor(x => x.Slot).GreaterThanOrEqualTo(0);
        }
    }
}
