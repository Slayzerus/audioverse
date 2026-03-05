using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class UpdateTeamHandler : IRequestHandler<UpdateTeamCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public UpdateTeamHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<bool> Handle(UpdateTeamCommand request, CancellationToken cancellationToken)
            => await _repo.UpdateTeamAsync(request.Team);
    }
}
