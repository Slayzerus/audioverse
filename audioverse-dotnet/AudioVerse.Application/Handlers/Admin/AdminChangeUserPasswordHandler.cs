using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.Admin
{
    public class AdminChangeUserPasswordHandler : IRequestHandler<AdminChangeUserPasswordCommand, bool>
    {
        private readonly UserManager<UserProfile> _userManager;
        private readonly IPasswordService _passwordService;
        private readonly IUserProfileRepository _repository;

        public AdminChangeUserPasswordHandler(
            UserManager<UserProfile> userManager,
            IPasswordService passwordService,
            IUserProfileRepository repository)
        {
            _userManager = userManager;
            _passwordService = passwordService;
            _repository = repository;
        }

        public async Task<bool> Handle(AdminChangeUserPasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByIdAsync(request.UserId);
            if (user == null)
                throw new Exception("Użytkownik nie został znaleziony");

            var (isValid, errors) = await _passwordService.ValidatePasswordAsync(request.NewPassword);
            if (!isValid)
                throw new Exception($"Hasło nie spełnia wymagań: {string.Join(", ", errors)}");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

            if (!result.Succeeded)
                throw new Exception($"Zmiana hasła nie powiodła się: {string.Join(", ", result.Errors.Select(e => e.Description))}");

            user.RequirePasswordChange = true;
            await _passwordService.AddPasswordToHistoryAsync(user.Id, user.PasswordHash!);
            _passwordService.UpdatePasswordExpiry(user);
            await _repository.UpdateAsync(user);

            return true;
        }
    }
}
