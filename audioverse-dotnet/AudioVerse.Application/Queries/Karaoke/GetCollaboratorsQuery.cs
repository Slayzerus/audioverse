using MediatR;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetCollaboratorsQuery(int SongId) : IRequest<IEnumerable<int>>;
}
