using MediatR;
using AudioVerse.Domain.Repositories;
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Services.User;
using Microsoft.AspNetCore.Identity;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Handlers.User
{
    public class RefreshTokenHandler : IRequestHandler<RefreshTokenCommand, (string NewAccessToken, string NewRefreshToken)>
    {
        private readonly IUserProfileRepository _repository;
        private readonly ITokenService _tokenService;
        private readonly UserManager<UserProfile> _userManager;

        public RefreshTokenHandler(IUserProfileRepository repository, ITokenService tokenService, UserManager<UserProfile> userManager)
        {
            _repository = repository;
            _tokenService = tokenService;
            _userManager = userManager;
        }

        public async Task<(string NewAccessToken, string NewRefreshToken)> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            var principal = _tokenService.ValidateExpiredToken(request.AccessToken);
            if (principal == null) throw new Exception("Invalid access token");

            var userId = int.Parse(principal.FindFirst("id")?.Value ?? "0");
            var user = await _repository.GetByIdAsync(userId);
            if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime < DateTime.UtcNow)
                throw new Exception("Invalid refresh token");

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _repository.UpdateAsync(user);

            return (newAccessToken, newRefreshToken);
        }
    }
}

