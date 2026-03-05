using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.User;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    public class GetUserMicrophonesHandler : IRequestHandler<GetUserMicrophonesQuery, List<MicrophoneDto>>
    {
        private readonly IUserProfileRepository _userProfileRepository;

        public GetUserMicrophonesHandler(IUserProfileRepository userProfileRepository)
        {
            _userProfileRepository = userProfileRepository;
        }

        public async Task<List<MicrophoneDto>> Handle(GetUserMicrophonesQuery request, CancellationToken cancellationToken)
        {
            var mics = await _userProfileRepository.GetMicrophonesByUserAsync(request.UserId);
            return mics
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new MicrophoneDto
                {
                    Id = d.Id,
                    UserId = d.UserId,
                    DeviceId = d.DeviceId,
                    Volume = d.Volume,
                    Threshold = d.Threshold,
                    Visible = d.Visible,
                    PitchDetectionMethod = d.PitchDetectionMethod,
                    OffsetMs = d.OffsetMs,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .ToList();
        }
    }
}
