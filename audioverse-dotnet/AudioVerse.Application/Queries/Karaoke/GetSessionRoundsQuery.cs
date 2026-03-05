using MediatR;
using AudioVerse.Application.Models.Dtos;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetSessionRoundsQuery(int SessionId) : IRequest<IEnumerable<KaraokeSessionRoundDto>>;
}
