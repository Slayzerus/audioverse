using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetTeamByIdHandler : IRequestHandler<GetTeamByIdQuery, KaraokeTeam?>
    {
        private readonly IKaraokeRepository _repo;
        public GetTeamByIdHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<KaraokeTeam?> Handle(GetTeamByIdQuery request, CancellationToken cancellationToken)
            => await _repo.GetTeamByIdAsync(request.TeamId);
    }
}
