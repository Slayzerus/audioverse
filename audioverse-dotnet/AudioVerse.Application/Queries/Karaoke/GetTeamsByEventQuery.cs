using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetTeamsByEventQuery(int EventId) : IRequest<IEnumerable<KaraokeTeam>>;
}
