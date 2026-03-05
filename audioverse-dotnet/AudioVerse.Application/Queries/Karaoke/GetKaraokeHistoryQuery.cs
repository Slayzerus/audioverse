using MediatR;
using AudioVerse.Application.Models.Karaoke;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetKaraokeHistoryQuery(int UserId, int Take = 20) : IRequest<List<KaraokeHistoryEntryDto>>;
}
