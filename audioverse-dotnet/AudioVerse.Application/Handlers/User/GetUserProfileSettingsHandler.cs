using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    /// <summary>Handles retrieving user profile settings.</summary>
    public class GetUserProfileSettingsHandler : IRequestHandler<GetUserProfileSettingsQuery, UserProfileSettings?>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public GetUserProfileSettingsHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<UserProfileSettings?> Handle(GetUserProfileSettingsQuery request, CancellationToken cancellationToken)
        {
            return await _userProfileRepository.GetUserProfileSettingsAsync(request.UserId);
        }
    }
}
