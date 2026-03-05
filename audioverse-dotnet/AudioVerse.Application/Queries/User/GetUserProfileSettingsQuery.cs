using AudioVerse.Domain.Entities.UserProfiles;
using MediatR;

namespace AudioVerse.Application.Queries.User
{
    /// <summary>Get user profile settings by user ID.</summary>
    public record GetUserProfileSettingsQuery(int UserId) : IRequest<UserProfileSettings?>;
}
