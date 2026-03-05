using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class RemoveRoundPlayerHandler : IRequestHandler<RemoveRoundPlayerCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public RemoveRoundPlayerHandler(IKaraokeRepository repo) { _repo = repo; }
        public async Task<bool> Handle(RemoveRoundPlayerCommand request, CancellationToken cancellationToken)
        {
            return await _repo.DeleteRoundPlayerAsync(request.RoundId, request.PlayerId);
        }
    }
}
