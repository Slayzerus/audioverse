using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class GetInputPresetHandler : IRequestHandler<GetInputPresetQuery, AudioInputPreset?>
    {
        private readonly IEditorRepository _repository;

        public GetInputPresetHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<AudioInputPreset?> Handle(GetInputPresetQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetInputPresetAsync(request.PresetId);
        }
    }
}
