using MediatR;
using System.Collections.Generic;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetAllSongsQuery(bool IncludeInDevelopment = false) : IRequest<IEnumerable<KaraokeSongFile>>;
}
