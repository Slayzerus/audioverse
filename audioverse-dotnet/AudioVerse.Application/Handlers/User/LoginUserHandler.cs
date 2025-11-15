using MediatR;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using AudioVerse.Application.Commands.User;
using Microsoft.Extensions.Logging;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Identity;
using AudioVerse.Application.Services.User;

namespace AudioVerse.Application.Handlers.User
{
    public class LoginUserHandler : IRequestHandler<LoginUserCommand, (string, string)>
    {
        private readonly ILogger<LoginUserHandler> _logger;
        private readonly IPasswordService _passwordService;
        private readonly IUserProfileRepository _repository;
        private readonly string _jwtSecret = "super-secret-key-for-jwt-authentication"; // 🔴 Zmienić na ENV w produkcji
        private readonly UserManager<UserProfile> _userManager;

        public LoginUserHandler(
            UserManager<UserProfile> userManager,
            ILogger<LoginUserHandler> logger,
            IPasswordService passwordService,
            IUserProfileRepository repository)
        {
            _userManager = userManager;
            _logger = logger;
            _passwordService = passwordService;
            _repository = repository;
        }

        public async Task<(string, string)> Handle(LoginUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            if (user == null)
                throw new Exception("Login lub Hasło niepoprawne");

            // Sprawdzenie czy konto jest zablokowane
            if (user.IsBlocked)
                throw new Exception("Konto zostało zablokowane. Skontaktuj się z administratorem.");

            bool isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!isPasswordValid)
                throw new Exception("Login lub Hasło niepoprawne");

            // Sprawdzenie czy hasło wygasło
            var isExpired = await _passwordService.IsPasswordExpiredAsync(user);
            if (isExpired)
            {
                user.RequirePasswordChange = true;
                await _repository.UpdateAsync(user);
                throw new Exception("Hasło wygasło. Wymagana zmiana hasła.");
            }

            // Sprawdzenie czy wymagana jest zmiana hasła
            if (user.RequirePasswordChange)
            {
                // Zwracamy specjalny token wskazujący na konieczność zmiany hasła
                var tempToken = GenerateJwtToken(user.Id, user.UserName ?? "", requirePasswordChange: true);
                return (tempToken, string.Empty);
            }

            var accessToken = GenerateJwtToken(user.Id, user.UserName ?? "");
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            return (accessToken, refreshToken);
        }

        private string GenerateJwtToken(int userId, string username, bool requirePasswordChange = false)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSecret);

            var claims = new List<Claim>
            {
                new Claim("id", userId.ToString()),
                new Claim("username", username),
                new Claim("requirePasswordChange", requirePasswordChange.ToString())
            };

            // Dodanie roli administratora
            if (username == "ADMIN")
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }
            else
            {
                claims.Add(new Claim(ClaimTypes.Role, "User"));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(15),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}