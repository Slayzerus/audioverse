using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class DeleteTeamHandler : IRequestHandler<DeleteTeamCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        public DeleteTeamHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<bool> Handle(DeleteTeamCommand request, CancellationToken cancellationToken)
            => await _repo.DeleteTeamAsync(request.TeamId);
    }
}
