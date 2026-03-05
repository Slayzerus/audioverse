using FluentValidation;
using AudioVerse.Application.Models.Requests.Karaoke;

namespace AudioVerse.Application.Validators.Karaoke
{
    public class SendEventInviteRequestValidator : AbstractValidator<SendEventInviteRequest>
    {
        public SendEventInviteRequestValidator()
        {
            RuleFor(x => x.ToUserId).GreaterThan(0).When(x => x.ToUserId.HasValue);
            RuleFor(x => x.ToEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.ToEmail));
            RuleFor(x => x.Message).MaximumLength(1000);
            RuleFor(x => x).Must(x => x.ToUserId.HasValue || !string.IsNullOrEmpty(x.ToEmail)).WithMessage("Either ToUserId or ToEmail must be provided");
        }
    }
}
