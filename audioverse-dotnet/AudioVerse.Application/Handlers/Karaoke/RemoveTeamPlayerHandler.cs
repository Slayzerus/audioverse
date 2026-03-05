using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class RemoveTeamPlayerHandler : IRequestHandler<RemoveTeamPlayerCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public RemoveTeamPlayerHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<bool> Handle(RemoveTeamPlayerCommand request, CancellationToken cancellationToken)
            => await _repo.RemoveTeamPlayerAsync(request.TeamId, request.PlayerId);
    }
}
