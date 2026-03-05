using FluentValidation;
using AudioVerse.Application.Models.Requests.Admin;

namespace AudioVerse.Application.Validators.Admin
{
    public class ScoringPresetsValidator : AbstractValidator<ScoringPresetsRequest>
    {
        public ScoringPresetsValidator()
        {
            RuleFor(x => x.Easy).NotNull();
            RuleFor(x => x.Normal).NotNull();
            RuleFor(x => x.Hard).NotNull();

            RuleForEach(x => new[] { x.Easy, x.Normal, x.Hard }).SetValidator(new ScoringLevelValidator());
        }
    }
}
