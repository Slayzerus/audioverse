using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class CreateTeamHandler : IRequestHandler<CreateTeamCommand, int>
    {
        private readonly IKaraokeRepository _repo;
        public CreateTeamHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<int> Handle(CreateTeamCommand request, CancellationToken cancellationToken)
            => await _repo.CreateTeamAsync(request.Team);
    }
}
