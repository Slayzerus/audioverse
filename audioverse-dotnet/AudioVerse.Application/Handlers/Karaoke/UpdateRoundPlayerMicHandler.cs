using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class UpdateRoundPlayerMicHandler : IRequestHandler<UpdateRoundPlayerMicCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public UpdateRoundPlayerMicHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<bool> Handle(UpdateRoundPlayerMicCommand request, CancellationToken cancellationToken)
        {
            return await _repo.UpdateRoundPlayerMicAsync(request.RoundId, request.AssignmentId, request.MicDeviceId);
        }
    }
}
