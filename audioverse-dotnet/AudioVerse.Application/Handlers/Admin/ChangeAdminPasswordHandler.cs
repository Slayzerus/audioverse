using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.Admin
{
    public class ChangeAdminPasswordHandler : IRequestHandler<ChangeAdminPasswordCommand, bool>
    {
        private readonly UserManager<UserProfile> _userManager;
        private readonly IPasswordService _passwordService;
        private readonly IUserProfileRepository _repository;

        public ChangeAdminPasswordHandler(
            UserManager<UserProfile> userManager,
            IPasswordService passwordService,
            IUserProfileRepository repository)
        {
            _userManager = userManager;
            _passwordService = passwordService;
            _repository = repository;
        }

        public async Task<bool> Handle(ChangeAdminPasswordCommand request, CancellationToken cancellationToken)
        {
            var admin = await _userManager.FindByNameAsync("ADMIN");
            if (admin == null)
                throw new Exception("Administrator nie został znaleziony");

            var isPasswordValid = await _userManager.CheckPasswordAsync(admin, request.OldPassword);
            if (!isPasswordValid)
                throw new Exception("Stare hasło jest niepoprawne");

            var (isValid, errors) = await _passwordService.ValidatePasswordAsync(request.NewPassword);
            if (!isValid)
                throw new Exception($"Hasło nie spełnia wymagań: {string.Join(", ", errors)}");

            var isInHistory = await _passwordService.IsPasswordInHistoryAsync(admin.Id, request.NewPassword);
            if (isInHistory)
                throw new Exception("Nie możesz użyć hasła, które było wcześniej używane");

            var result = await _userManager.ChangePasswordAsync(admin, request.OldPassword, request.NewPassword);
            if (!result.Succeeded)
                throw new Exception($"Zmiana hasła nie powiodła się: {string.Join(", ", result.Errors.Select(e => e.Description))}");

            await _passwordService.AddPasswordToHistoryAsync(admin.Id, admin.PasswordHash!);
            _passwordService.UpdatePasswordExpiry(admin);
            await _repository.UpdateAsync(admin);

            return true;
        }
    }
}
