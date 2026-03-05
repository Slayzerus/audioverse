using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetTeamPlayersQuery(int TeamId) : IRequest<IEnumerable<KaraokeTeamPlayer>>;
}
