using MediatR;
using AudioVerse.Application.Models.Karaoke;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetKaraokeActivityQuery(int Days = 30) : IRequest<List<KaraokeActivityEntryDto>>;
}
