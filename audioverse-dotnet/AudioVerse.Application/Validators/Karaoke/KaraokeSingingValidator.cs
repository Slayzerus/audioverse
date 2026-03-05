using FluentValidation;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;

namespace AudioVerse.Application.Validators.Karaoke
{
    public class KaraokeSingingValidator : AbstractValidator<KaraokeSinging>
    {
        public KaraokeSingingValidator()
        {
            RuleFor(x => x.RoundId)
                .GreaterThan(0)
                .WithMessage("RoundId is required and must be greater than 0");

            RuleFor(x => x.PlayerId)
                .GreaterThan(0)
                .WithMessage("PlayerId is required and must be greater than 0");

            RuleFor(x => x.Score)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Score must be >= 0");

            RuleFor(x => x.Hits).GreaterThanOrEqualTo(0);
            RuleFor(x => x.Misses).GreaterThanOrEqualTo(0);
            RuleFor(x => x.Good).GreaterThanOrEqualTo(0);
            RuleFor(x => x.Perfect).GreaterThanOrEqualTo(0);
            RuleFor(x => x.Combo).GreaterThanOrEqualTo(0);

            RuleFor(x => x.Recordings).NotNull();
        }
    }
}
