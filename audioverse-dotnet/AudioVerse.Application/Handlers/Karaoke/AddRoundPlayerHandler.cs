using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddRoundPlayerHandler : IRequestHandler<AddRoundPlayerCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public AddRoundPlayerHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<int> Handle(AddRoundPlayerCommand request, CancellationToken cancellationToken)
        {
            // prevent duplicates
            var existing = await _repo.FindExistingRoundPlayerAsync(request.Player.RoundId, request.Player.PlayerId, request.Player.Slot);
            if (existing != null) return existing.Id;

            // enforce reasonable per-round cap
            var count = await _repo.CountRoundPlayersAsync(request.Player.RoundId);
            if (count >= 500) throw new InvalidOperationException("Too many assignments for this round");

            return await _repo.AddRoundPlayerAsync(request.Player);
        }
    }
}
