using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetTeamPlayersHandler : IRequestHandler<GetTeamPlayersQuery, IEnumerable<KaraokeTeamPlayer>>
    {
        private readonly IKaraokeRepository _repo;
        public GetTeamPlayersHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<IEnumerable<KaraokeTeamPlayer>> Handle(GetTeamPlayersQuery request, CancellationToken cancellationToken)
            => await _repo.GetTeamPlayersAsync(request.TeamId);
    }
}
