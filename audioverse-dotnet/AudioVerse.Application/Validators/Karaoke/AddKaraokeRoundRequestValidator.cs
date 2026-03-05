using FluentValidation;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Application.Validators.Karaoke
{
    public class AddKaraokeRoundRequestValidator : AbstractValidator<KaraokeSessionRound>
    {
        public AddKaraokeRoundRequestValidator()
        {
            RuleFor(x => x.EventId).GreaterThan(0).WithMessage("EventId is required");
            RuleFor(x => x.SongId).GreaterThan(0).WithMessage("SongId is required");
        }
    }
}
