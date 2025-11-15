using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Queries.Editor
{
    public class GetProjectsQuery : IRequest<IEnumerable<AudioProject>> { }
}
