using FluentValidation;
using AudioVerse.Application.Models.Requests.User;

namespace AudioVerse.Application.Validators.User
{
    /// <summary>
    /// Walidator requestu wyszukiwania graczy do zlinkowania.
    /// </summary>
    public class PlayerLinkSearchRequestValidator : AbstractValidator<PlayerLinkSearchRequest>
    {
        public PlayerLinkSearchRequestValidator()
        {
            RuleFor(x => x.Login).NotEmpty().MaximumLength(256);
            RuleFor(x => x.Password).NotEmpty().MaximumLength(256);
        }
    }
}
