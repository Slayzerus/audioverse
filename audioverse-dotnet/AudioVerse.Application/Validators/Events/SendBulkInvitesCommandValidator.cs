using AudioVerse.Application.Commands.Events;
using FluentValidation;

namespace AudioVerse.Application.Validators.Events
{
    public class SendBulkInvitesCommandValidator : AbstractValidator<SendBulkInvitesCommand>
    {
        public SendBulkInvitesCommandValidator()
        {
            RuleFor(x => x.EventId).GreaterThan(0).WithMessage("EventId is required.");
            RuleFor(x => x.TemplateId).GreaterThan(0).WithMessage("TemplateId is required.");

            RuleFor(x => x.ContactIds)
                .NotNull().WithMessage("ContactIds is required.")
                .Must(c => c != null && c.Length > 0).WithMessage("At least one contact must be specified.")
                .Must(c => c != null && c.Length <= 500).WithMessage("Cannot send more than 500 invites at once.");
        }
    }
}
