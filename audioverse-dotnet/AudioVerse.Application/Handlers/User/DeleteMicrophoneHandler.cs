using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class DeleteMicrophoneHandler : IRequestHandler<DeleteMicrophoneCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public DeleteMicrophoneHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<bool> Handle(DeleteMicrophoneCommand request, CancellationToken cancellationToken)
        {
            var mic = await _userProfileRepository.GetMicrophoneByIdAsync(request.MicrophoneRecordId);
            if (mic == null || mic.UserId != request.UserId)
                return false;

            return await _userProfileRepository.DeleteMicrophoneAsync(request.MicrophoneRecordId);
        }
    }
}
