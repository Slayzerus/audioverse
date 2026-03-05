using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class UpdateRoundPlayerSlotHandler : IRequestHandler<UpdateRoundPlayerSlotCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public UpdateRoundPlayerSlotHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<bool> Handle(UpdateRoundPlayerSlotCommand request, CancellationToken cancellationToken)
        {
            return await _repo.UpdateRoundPlayerSlotAsync(request.RoundId, request.AssignmentId, request.Slot);
        }
    }
}
