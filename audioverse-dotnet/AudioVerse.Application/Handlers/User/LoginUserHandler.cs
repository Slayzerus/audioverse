using MediatR;
using AudioVerse.Application.Commands.User;
using Microsoft.Extensions.Logging;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Identity;
using AudioVerse.Application.Services.User;
using AudioVerse.Application.Models;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Handlers.User
{
    public class LoginUserHandler : IRequestHandler<LoginUserCommand, LoginResponse>
    {
        private readonly ILogger<LoginUserHandler> _logger;
        private readonly IPasswordService _passwordService;
        private readonly IUserProfileRepository _repository;
        private readonly ITokenService _tokenService;
        private readonly ILoginAttemptService _loginAttemptService;
        private readonly UserManager<UserProfile> _userManager;

        public LoginUserHandler(
            UserManager<UserProfile> userManager,
            ILogger<LoginUserHandler> logger,
            IPasswordService passwordService,
            IUserProfileRepository repository,
            ITokenService tokenService,
            ILoginAttemptService loginAttemptService)
        {
            _userManager = userManager;
            _logger = logger;
            _passwordService = passwordService;
            _repository = repository;
            _tokenService = tokenService;
            _loginAttemptService = loginAttemptService;
        }

        public async Task<LoginResponse> Handle(LoginUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            
            if (user == null)
            {
                return new LoginResponse
                {
                    Success = false,
                    ErrorMessage = "Login lub Hasło niepoprawne",
                    IsBlocked = false,
                    RequirePasswordChange = false
                };
            }

            // Sprawdzenie czy konto jest czasowo zablokowane (15 minut po 5 błędnych logowaniach)
            var (isLockedOut, remainingTime) = await _loginAttemptService.IsUserBlockedAsync(user.Id);
            if (isLockedOut)
            {
                await _loginAttemptService.RecordLoginAttemptAsync(user.Id, user.UserName!, false);
                
                return new LoginResponse
                {
                    Success = false,
                    ErrorMessage = $"Konto czasowo zablokowane. Spróbuj ponownie za {(int)remainingTime.TotalSeconds} sekund.",
                    IsBlocked = true,
                    RequirePasswordChange = false,
                    UserId = user.Id,
                    Username = user.UserName
                };
            }

            // Sprawdzenie czy konto jest trwale zablokowane
            if (user.IsBlocked)
            {
                await _loginAttemptService.RecordLoginAttemptAsync(user.Id, user.UserName!, false);
                
                return new LoginResponse
                {
                    Success = false,
                    ErrorMessage = "Konto zostało zablokowane. Skontaktuj się z administratorem.",
                    IsBlocked = true,
                    RequirePasswordChange = false,
                    UserId = user.Id,
                    Username = user.UserName
                };
            }

            bool isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!isPasswordValid)
            {
                // Zarejestruj nieudaną próbę
                await _loginAttemptService.RecordLoginAttemptAsync(user.Id, user.UserName!, false);
                
                return new LoginResponse
                {
                    Success = false,
                    ErrorMessage = "Login lub Hasło niepoprawne",
                    IsBlocked = false,
                    RequirePasswordChange = false,
                    UserId = user.Id,
                    Username = user.UserName
                };
            }

            // Sprawdzenie czy hasło wygasło
            var isExpired = await _passwordService.IsPasswordExpiredAsync(user);
            if (isExpired)
            {
                user.RequirePasswordChange = true;
                await _repository.UpdateAsync(user);
                
                // Zarejestruj próbę z wygasłym hasłem
                await _loginAttemptService.RecordLoginAttemptAsync(user.Id, user.UserName!, true);
                
                var roles = await _userManager.GetRolesAsync(user);
                var tempToken = _tokenService.GenerateAccessToken(user, roles, requirePasswordChange: true);
                
                return new LoginResponse
                {
                    Success = true,
                    AccessToken = tempToken,
                    RefreshToken = string.Empty,
                    ErrorMessage = "Hasło wygasło. Wymagana zmiana hasła.",
                    IsBlocked = false,
                    RequirePasswordChange = true,
                    UserId = user.Id,
                    Username = user.UserName
                };
            }

            // Sprawdzenie czy wymagana jest zmiana hasła
            if (user.RequirePasswordChange)
            {
                await _loginAttemptService.RecordLoginAttemptAsync(user.Id, user.UserName!, true);
                
                var roles = await _userManager.GetRolesAsync(user);
                var tempToken = _tokenService.GenerateAccessToken(user, roles, requirePasswordChange: true);
                
                return new LoginResponse
                {
                    Success = true,
                    AccessToken = tempToken,
                    RefreshToken = string.Empty,
                    ErrorMessage = "Wymagana zmiana hasła przy pierwszym logowaniu.",
                    IsBlocked = false,
                    RequirePasswordChange = true,
                    UserId = user.Id,
                    Username = user.UserName
                };
            }

            // Pomyślne logowanie
            await _loginAttemptService.RecordLoginAttemptAsync(user.Id, user.UserName!, true);

            var accessRoles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateAccessToken(user, accessRoles);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            return new LoginResponse
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ErrorMessage = null,
                IsBlocked = false,
                RequirePasswordChange = false,
                UserId = user.Id,
                Username = user.UserName
            };
        }
    }
}
