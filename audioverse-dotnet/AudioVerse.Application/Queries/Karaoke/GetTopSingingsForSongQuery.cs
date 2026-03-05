using MediatR;
using AudioVerse.Application.Models.Karaoke;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetTopSingingsForSongQuery(int SongId, int Take = 10) : IRequest<List<KaraokeTopSingingDto>>;
}
