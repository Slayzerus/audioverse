using AudioVerse.Application.Commands.Events;
using FluentValidation;

namespace AudioVerse.Application.Validators.Events
{
    public class PlaceBetCommandValidator : AbstractValidator<PlaceBetCommand>
    {
        public PlaceBetCommandValidator()
        {
            RuleFor(x => x.MarketId).GreaterThan(0).WithMessage("MarketId is required.");
            RuleFor(x => x.OptionId).GreaterThan(0).WithMessage("OptionId is required.");
            RuleFor(x => x.UserId).GreaterThan(0).WithMessage("UserId is required.");

            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Bet amount must be greater than 0.")
                .LessThanOrEqualTo(100_000).WithMessage("Bet amount must not exceed 100,000.");
        }
    }
}
