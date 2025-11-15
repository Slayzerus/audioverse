using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class GetProjectDetailsHandler : IRequestHandler<GetProjectDetailsQuery, AudioProject?>
    {
        private readonly IEditorRepository _repository;

        public GetProjectDetailsHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<AudioProject?> Handle(GetProjectDetailsQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetProjectWithDetailsAsync(request.ProjectId);
        }
    }
}
