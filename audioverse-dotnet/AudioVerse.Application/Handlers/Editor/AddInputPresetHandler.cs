using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddInputPresetHandler : IRequestHandler<AddInputPresetCommand, int>
    {
        private readonly IEditorRepository _repository;

        public AddInputPresetHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddInputPresetCommand request, CancellationToken cancellationToken)
        {
            var preset = new AudioInputPreset
            {
                Version = request.Version,
                Name = request.Name,
                UserProfileId = request.UserProfileId
            };

            return await _repository.AddInputPresetAsync(preset);
        }
    }
}
