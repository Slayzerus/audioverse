using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Queries.Editor
{
    public class GetProjectTemplatesQuery : IRequest<IEnumerable<AudioProject>> { }
}
