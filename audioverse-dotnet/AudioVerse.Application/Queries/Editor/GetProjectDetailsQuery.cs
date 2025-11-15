using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Queries.Editor
{
    public class GetProjectDetailsQuery : IRequest<AudioProject?>
    {
        public int ProjectId { get; set; }

        public GetProjectDetailsQuery(int projectId)
        {
            ProjectId = projectId;
        }
    }
}
