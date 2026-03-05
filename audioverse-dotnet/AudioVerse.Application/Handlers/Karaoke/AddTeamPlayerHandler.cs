using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AddTeamPlayerHandler : IRequestHandler<AddTeamPlayerCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public AddTeamPlayerHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<int> Handle(AddTeamPlayerCommand request, CancellationToken cancellationToken)
            => await _repo.AddTeamPlayerAsync(request.TeamPlayer);
    }
}
