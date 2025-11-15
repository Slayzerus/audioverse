using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddLayerHandler : IRequestHandler<AddLayerCommand, int>
    {
        private readonly IEditorRepository _repository;

        public AddLayerHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddLayerCommand request, CancellationToken cancellationToken)
        {
            var layer = new AudioLayer
            {
                SectionId = request.SectionId,
                AudioSource = request.AudioSource,
                AudioSourceParameters = request.AudioSourceParameters
            };

            return await _repository.AddLayerAsync(layer);
        }
    }
}
