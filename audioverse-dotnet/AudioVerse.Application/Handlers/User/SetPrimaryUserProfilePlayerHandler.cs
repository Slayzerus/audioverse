using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class SetPrimaryUserProfilePlayerHandler : IRequestHandler<SetPrimaryUserProfilePlayerCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public SetPrimaryUserProfilePlayerHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<bool> Handle(SetPrimaryUserProfilePlayerCommand request, CancellationToken cancellationToken)
        {
            // Ensure the player exists and belongs to the profile
            var player = await _userProfileRepository.GetPlayerByIdAsync(request.PlayerId);
            if (player == null || player.ProfileId != request.ProfileId) 
                return false;

            return await _userProfileRepository.SetPrimaryPlayerAsync(request.ProfileId, request.PlayerId);
        }
    }
}
