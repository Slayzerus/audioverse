using MediatR;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetTeamByIdQuery(int TeamId) : IRequest<KaraokeTeam?>;
}
