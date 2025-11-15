using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class GetInputPresetsHandler : IRequestHandler<GetInputPresetsQuery, IEnumerable<AudioInputPreset>>
    {
        private readonly IEditorRepository _repository;

        public GetInputPresetsHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<AudioInputPreset>> Handle(GetInputPresetsQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetInputPresetsAsync(request.Skip, request.Take, request.Search);
        }
    }
}
