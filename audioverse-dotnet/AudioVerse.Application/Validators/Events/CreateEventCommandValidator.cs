using AudioVerse.Application.Commands.Events;
using FluentValidation;

namespace AudioVerse.Application.Validators.Events
{
    public class CreateEventCommandValidator : AbstractValidator<CreateEventCommand>
    {
        public CreateEventCommandValidator()
        {
            RuleFor(x => x.Event).NotNull().WithMessage("Event is required.");

            RuleFor(x => x.Event.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MaximumLength(200).WithMessage("Title must not exceed 200 characters.")
                .When(x => x.Event != null);

            RuleFor(x => x.Event.StartTime)
                .GreaterThanOrEqualTo(DateTime.UtcNow.AddMinutes(-5))
                .WithMessage("Start time must not be in the past.")
                .When(x => x.Event?.StartTime != null);

            RuleFor(x => x.Event.EndTime)
                .GreaterThan(x => x.Event.StartTime)
                .WithMessage("End time must be after start time.")
                .When(x => x.Event?.StartTime != null && x.Event?.EndTime != null);

            RuleFor(x => x.Event.MaxParticipants)
                .GreaterThan(0).WithMessage("Max participants must be greater than 0.")
                .When(x => x.Event?.MaxParticipants != null);
        }
    }
}
