using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class GetProjectsHandler : IRequestHandler<GetProjectsQuery, IEnumerable<AudioProject>>
    {
        private readonly IEditorRepository _repository;

        public GetProjectsHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<AudioProject>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetProjectsAsync();
        }
    }
}
