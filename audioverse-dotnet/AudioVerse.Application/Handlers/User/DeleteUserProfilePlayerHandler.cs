using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class DeleteUserProfilePlayerHandler : IRequestHandler<DeleteUserProfilePlayerCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public DeleteUserProfilePlayerHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<bool> Handle(DeleteUserProfilePlayerCommand request, CancellationToken cancellationToken)
        {
            var player = await _userProfileRepository.GetPlayerByIdAsync(request.PlayerId);
            if (player == null || player.ProfileId != request.ProfileId)
                return false;

            return await _userProfileRepository.DeletePlayerAsync(request.PlayerId);
        }
    }
}
