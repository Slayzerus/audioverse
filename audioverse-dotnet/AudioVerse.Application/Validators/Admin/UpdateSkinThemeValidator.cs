using AudioVerse.Application.Commands.Admin;
using FluentValidation;

namespace AudioVerse.Application.Validators.Admin
{
    public class UpdateSkinThemeValidator : AbstractValidator<UpdateSkinThemeCommand>
    {
        public UpdateSkinThemeValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100);

            RuleFor(x => x.Emoji)
                .NotEmpty().WithMessage("Emoji is required.")
                .MaximumLength(10);

            RuleFor(x => x.Vars)
                .NotNull().WithMessage("Vars map is required.")
                .Must(v => v != null && v.Count > 0).WithMessage("Vars must contain at least one entry.");
        }
    }
}
