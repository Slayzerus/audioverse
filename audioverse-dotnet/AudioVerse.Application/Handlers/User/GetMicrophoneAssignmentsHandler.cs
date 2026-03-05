using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class GetMicrophoneAssignmentsHandler : IRequestHandler<GetMicrophoneAssignmentsQuery, List<MicrophoneAssignmentDto>>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public GetMicrophoneAssignmentsHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<List<MicrophoneAssignmentDto>> Handle(GetMicrophoneAssignmentsQuery request, CancellationToken cancellationToken)
        {
            var assignments = await _userProfileRepository.GetAllMicrophoneAssignmentsAsync();
            return assignments
                .Select(a => new MicrophoneAssignmentDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    MicrophoneId = a.MicrophoneId,
                    Color = a.Color,
                    Slot = a.Slot,
                    AssignedAt = a.AssignedAt
                })
                .ToList();
        }
    }
}
