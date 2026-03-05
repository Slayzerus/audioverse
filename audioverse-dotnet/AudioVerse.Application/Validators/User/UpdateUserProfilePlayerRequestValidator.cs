using FluentValidation;
using AudioVerse.Application.Models.Requests.User;

namespace AudioVerse.Application.Validators.User
{
    public class UpdateUserProfilePlayerRequestValidator : AbstractValidator<UpdateUserProfilePlayerRequest>
    {
        public UpdateUserProfilePlayerRequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            RuleFor(x => x.PreferredColors).MaximumLength(1000);
            RuleFor(x => x.FillPattern).NotEmpty().MaximumLength(50);
        }
    }
}
