using MediatR;
using AudioVerse.Application.Models.Dtos;
using AudioVerse.Application.Models.Requests.Karaoke;
using AudioVerse.Application.Models.Common;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetFilteredSongsQuery(SongFilterRequest Filter) : IRequest<PagedResult<KaraokeSongDto>>;
}
