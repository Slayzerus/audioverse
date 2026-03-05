using AudioVerse.Application.Commands.Events;
using FluentValidation;

namespace AudioVerse.Application.Validators.Events
{
    public class AddExpenseCommandValidator : AbstractValidator<AddExpenseCommand>
    {
        public AddExpenseCommandValidator()
        {
            RuleFor(x => x.Expense).NotNull().WithMessage("Expense is required.");

            RuleFor(x => x.Expense.Amount)
                .GreaterThan(0).WithMessage("Amount must be greater than 0.")
                .LessThanOrEqualTo(1_000_000).WithMessage("Amount must not exceed 1,000,000.")
                .When(x => x.Expense != null);

            RuleFor(x => x.Expense.Description)
                .NotEmpty().WithMessage("Description is required.")
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters.")
                .When(x => x.Expense != null);
        }
    }
}
