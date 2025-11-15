using MediatR;
using AudioVerse.Domain.Entities.Karaoke;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetAllSongsQuery() : IRequest<IEnumerable<KaraokeSongFile>>;
}
