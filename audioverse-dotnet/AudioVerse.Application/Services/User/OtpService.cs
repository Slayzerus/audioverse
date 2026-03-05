using AudioVerse.Application.Models;
using AudioVerse.Application.Services.Security;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Services.User
{
    public class OtpService : IOtpService
    {
        private readonly IUserSecurityRepository _securityRepo;
        private readonly IUserProfileRepository _userRepo;
        private readonly IPasswordHasher<UserProfile> _passwordHasher;
        private readonly ICustomHashService _customHashService;
        private const int DefaultOtpLength = 6;

        public OtpService(
            IUserSecurityRepository securityRepo,
            IUserProfileRepository userRepo,
            IPasswordHasher<UserProfile> passwordHasher,
            ICustomHashService customHashService)
        {
            _securityRepo = securityRepo;
            _userRepo = userRepo;
            _passwordHasher = passwordHasher;
            _customHashService = customHashService;
        }

        public async Task<string> GenerateOtpAsync(UserProfile user, int expirationMinutes = 30)
        {
            string otp = GenerateOtpWithLgFormula(user.UserName ?? user.Email ?? user.Id.ToString());
            string otpHash = _customHashService.HashPassword(user.UserName ?? user.Email ?? user.Id.ToString(), otp);

            await _securityRepo.InvalidateUserOtpsAsync(user.Id);

            var oneTimePassword = new OneTimePassword
            {
                UserId = user.Id,
                PasswordHash = otpHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes),
                IsUsed = false
            };

            await _securityRepo.CreateOtpAsync(oneTimePassword);

            return otp;
        }

        public async Task<bool> ValidateOtpAsync(UserProfile user, string otp)
        {
            var oneTimePassword = await _securityRepo.GetValidOtpAsync(user.Id, "");
            if (oneTimePassword == null)
                return false;

            bool isValid = _customHashService.VerifyPassword(
                user.UserName ?? user.Email ?? user.Id.ToString(),
                otp,
                oneTimePassword.PasswordHash);

            if (isValid)
            {
                await _securityRepo.MarkOtpUsedAsync(oneTimePassword.Id);
                return true;
            }

            return false;
        }

        public async Task<OtpGenerationResult?> GenerateOtpAsync(int userId, int expirationMinutes = 30)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Użytkownik nie został znaleziony");

            string otp = GenerateOtpWithLgFormula(user.UserName ?? user.Email ?? userId.ToString());
            string otpHash = _customHashService.HashPassword(user.UserName ?? user.Email ?? userId.ToString(), otp);

            await _securityRepo.InvalidateUserOtpsAsync(userId);

            var oneTimePassword = new OneTimePassword
            {
                UserId = userId,
                PasswordHash = otpHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes),
                IsUsed = false
            };

            await _securityRepo.CreateOtpAsync(oneTimePassword);

            return new OtpGenerationResult
            {
                Id = oneTimePassword.Id,
                UserId = oneTimePassword.UserId,
                Otp = otp,
                CreatedAt = oneTimePassword.CreatedAt,
                ExpiresAt = oneTimePassword.ExpiresAt,
                IsUsed = oneTimePassword.IsUsed
            };
        }

        public async Task<List<OneTimePassword>> GetAllOtpsAsync()
        {
            return (await _securityRepo.GetAllOtpsAsync()).ToList();
        }

        private string GenerateRandomPassword(int length, bool onlyDigits = false)
        {
            string validChars = onlyDigits 
                ? "0123456789"  // Tylko cyfry dla OTP
                : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";  // A-Z i cyfry dla haseł
            
            var random = new Random();
            return new string(Enumerable.Range(0, length)
                .Select(_ => validChars[random.Next(validChars.Length)])
                .ToArray());
        }

        /// <summary>
        /// Generuj OTP używając funkcji jednokierunkowej lg(a*x)
        /// a = długość identyfikatora (username/email)
        /// x = domyślna długość OTP (6)
        /// 
        /// Długość finalna OTP = dynamiczna, obliczana z lg(a*x)
        /// Przykład: username="john" (a=4), x=6
        /// lg(4*6) = lg(24) ≈ 1.38 → skaluj na 1-8 znaków
        /// </summary>
        private string GenerateOtpWithLgFormula(string identifier)
        {
            // a = długość identyfikatora
            int a = identifier.Length;
            
            // x = domyślna długość OTP
            int x = DefaultOtpLength;
            
            // lg(a*x) = log10(a * x)
            double logValue = Math.Log10(a * x);
            
            // Skaluj lg do rozsądnej długości OTP (6-12 znaków)
            // lg(a*x) zwykle wynosi 1-3, skalujemy do 6-12
            int otpLength = Math.Max(6, Math.Min(12, (int)Math.Round(6 + logValue * 2)));
            
            // Loguj dla debugowania
            System.Diagnostics.Debug.WriteLine(
                $"OTP Generation - identifier:'{identifier}' (a={a}), x={x}, lg({a}*{x}) = {logValue:F3} → length={otpLength}");
            
            // Generuj OTP o dynamicznej długości, TYLKO CYFRY
            return GenerateRandomPassword(otpLength, onlyDigits: true);
        }
    }
}
