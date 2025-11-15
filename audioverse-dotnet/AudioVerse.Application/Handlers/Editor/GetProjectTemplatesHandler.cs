using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class GetProjectTemplatesHandler : IRequestHandler<GetProjectTemplatesQuery, IEnumerable<AudioProject>>
    {
        private readonly IEditorRepository _repository;

        public GetProjectTemplatesHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<AudioProject>> Handle(GetProjectTemplatesQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetProjectTemplatesAsync();
        }
    }
}
