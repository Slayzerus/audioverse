using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class CreateUserProfilePlayerHandler : IRequestHandler<CreateUserProfilePlayerCommand, int>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public CreateUserProfilePlayerHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<int> Handle(CreateUserProfilePlayerCommand request, CancellationToken cancellationToken)
        {
            var entity = new UserProfilePlayer
            {
                ProfileId = request.ProfileId,
                Name = request.Name,
                PreferredColors = request.PreferredColors,
                FillPattern = request.FillPattern,
                IsPrimary = request.IsMainPlayer,
                Email = request.Email,
                Icon = request.Icon,
                KaraokeSettings = request.KaraokeSettings ?? new KaraokeSettings()
            };

            return await _userProfileRepository.CreatePlayerAsync(entity);
        }
    }
}
