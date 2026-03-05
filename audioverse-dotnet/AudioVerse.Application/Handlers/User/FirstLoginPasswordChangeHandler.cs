using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.User
{
    public class FirstLoginPasswordChangeHandler : IRequestHandler<FirstLoginPasswordChangeCommand, bool>
    {
        private readonly UserManager<UserProfile> _userManager;
        private readonly IPasswordService _passwordService;
        private readonly IUserProfileRepository _repository;

        public FirstLoginPasswordChangeHandler(
            UserManager<UserProfile> userManager,
            IPasswordService passwordService,
            IUserProfileRepository repository)
        {
            _userManager = userManager;
            _passwordService = passwordService;
            _repository = repository;
        }

        public async Task<bool> Handle(FirstLoginPasswordChangeCommand request, CancellationToken cancellationToken)
        {
            if (request.NewPassword != request.ConfirmPassword)
                throw new Exception("Hasła nie są identyczne");

            var user = await _repository.GetByIdAsync(request.UserId);
            if (user == null)
                throw new Exception("Użytkownik nie został znaleziony");

            if (user.IsBlocked)
                throw new Exception("Konto jest zablokowane");

            if (!user.RequirePasswordChange)
                throw new Exception("Nie wymagana zmiana hasła");

            var (isValid, errors) = await _passwordService.ValidatePasswordAsync(request.NewPassword);
            if (!isValid)
                throw new Exception($"Hasło nie spełnia wymagań: {string.Join(", ", errors)}");

            var isInHistory = await _passwordService.IsPasswordInHistoryAsync(user.Id, request.NewPassword);
            if (isInHistory)
                throw new Exception("Nie możesz użyć hasła, które było wcześniej używane");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

            if (!result.Succeeded)
                throw new Exception($"Zmiana hasła nie powiodła się: {string.Join(", ", result.Errors.Select(e => e.Description))}");

            await _passwordService.AddPasswordToHistoryAsync(user.Id, user.PasswordHash!);
            user.RequirePasswordChange = false;
            _passwordService.UpdatePasswordExpiry(user);
            await _repository.UpdateAsync(user);

            return true;
        }
    }
}
