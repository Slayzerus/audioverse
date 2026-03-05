using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetTeamsByEventHandler : IRequestHandler<GetTeamsByEventQuery, IEnumerable<KaraokeTeam>>
    {
        private readonly IKaraokeRepository _repo;
        public GetTeamsByEventHandler(IKaraokeRepository repo) => _repo = repo;

        public async Task<IEnumerable<KaraokeTeam>> Handle(GetTeamsByEventQuery request, CancellationToken cancellationToken)
            => await _repo.GetTeamsByEventAsync(request.EventId);
    }
}
