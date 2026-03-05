using System.Security.Claims;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Services.User;

public interface ITokenService
{
    string GenerateAccessToken(UserProfile user, IList<string> roles, bool requirePasswordChange = false);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateExpiredToken(string token);
}
