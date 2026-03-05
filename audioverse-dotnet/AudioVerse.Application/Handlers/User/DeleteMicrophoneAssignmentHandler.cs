using AudioVerse.Application.Commands.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class DeleteMicrophoneAssignmentHandler : IRequestHandler<DeleteMicrophoneAssignmentCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public DeleteMicrophoneAssignmentHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<bool> Handle(DeleteMicrophoneAssignmentCommand request, CancellationToken cancellationToken)
        {
            var assignment = await _userProfileRepository.GetMicrophoneAssignmentByIdAsync(request.AssignmentId);
            if (assignment == null || assignment.UserId != request.UserId)
                return false;

            return await _userProfileRepository.DeleteMicrophoneAssignmentAsync(request.AssignmentId);
        }
    }
}
