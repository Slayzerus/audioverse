using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class UpdateLayerHandler : IRequestHandler<UpdateLayerCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public UpdateLayerHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(UpdateLayerCommand request, CancellationToken cancellationToken)
        {
            var entity = new AudioLayer
            {
                Id = request.Id,
                Name = request.Name,
                AudioClipId = request.AudioClipId
            };
            return await _repository.UpdateLayerAsync(entity);
        }
    }
}
