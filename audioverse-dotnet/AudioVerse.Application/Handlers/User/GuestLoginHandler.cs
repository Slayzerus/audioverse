using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.Application.Handlers.User
{
    public class GuestLoginHandler : IRequestHandler<GuestLoginCommand, GuestLoginResult>
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly UserManager<UserProfile> _userManager;
        private readonly ITokenService _tokenService;

        public GuestLoginHandler(IUserProfileRepository userProfileRepository, UserManager<UserProfile> userManager, ITokenService tokenService)
        {
            _userProfileRepository = userProfileRepository;
            _userManager = userManager;
            _tokenService = tokenService;
        }

        public async Task<GuestLoginResult> Handle(GuestLoginCommand request, CancellationToken cancellationToken)
        {
            // Create unique guest user
            var guestName = $"Guest_{Guid.NewGuid().ToString("N")[..8]}";
            var guest = new UserProfile
            {
                UserName = guestName,
                Email = $"{guestName}@guest.audioverse",
                EmailConfirmed = false,
                FullName = "Guest AudioVerse",
                IsBlocked = false,
                RequirePasswordChange = false,
                CreatedAt = DateTime.UtcNow
            };
            await _userProfileRepository.CreateAsync(guest);

            // Assign Guest role
            await _userManager.AddToRoleAsync(guest, "Guest");

            // Generate JWT token with Guest role
            var roles = new List<string> { "Guest" };
            var accessToken = _tokenService.GenerateAccessToken(guest, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();
            guest.RefreshToken = refreshToken;
            guest.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(2);
            await _userManager.UpdateAsync(guest);

            return new GuestLoginResult
            {
                Success = true,
                UserId = guest.Id,
                Username = guest.UserName!,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }
    }
}
