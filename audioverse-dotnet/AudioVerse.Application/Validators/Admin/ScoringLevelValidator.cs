using FluentValidation;
using AudioVerse.Application.Models.Requests.Admin;

namespace AudioVerse.Application.Validators.Admin
{
    public class ScoringLevelValidator : AbstractValidator<ScoringLevelPreset>
    {
        public ScoringLevelValidator()
        {
            RuleFor(x => x.SemitoneTolerance).InclusiveBetween(0, 12);
            RuleFor(x => x.PreWindow).InclusiveBetween(0.0, 5.0);
            RuleFor(x => x.PostExtra).InclusiveBetween(0.0, 5.0);
            RuleFor(x => x.DifficultyMult).InclusiveBetween(0.5, 2.0);
        }
    }
}
