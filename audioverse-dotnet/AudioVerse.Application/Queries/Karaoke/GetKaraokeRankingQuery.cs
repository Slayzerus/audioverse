using MediatR;
using AudioVerse.Application.Models.Karaoke;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetKaraokeRankingQuery(int Top = 20) : IRequest<List<KaraokeRankingEntryDto>>;
}
