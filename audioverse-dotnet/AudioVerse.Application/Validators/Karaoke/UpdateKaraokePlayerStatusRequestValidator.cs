using FluentValidation;
using AudioVerse.Application.Models.Requests.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Validators.Karaoke
{
    public class UpdateKaraokePlayerStatusRequestValidator : AbstractValidator<UpdateKaraokePlayerStatusRequest>
    {
        public UpdateKaraokePlayerStatusRequestValidator()
        {
            RuleFor(x => x.Status).IsInEnum();
        }
    }
}
