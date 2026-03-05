using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class DeleteLayerHandler : IRequestHandler<DeleteLayerCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public DeleteLayerHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(DeleteLayerCommand request, CancellationToken cancellationToken)
        {
            return await _repository.DeleteLayerAsync(request.Id);
        }
    }
}
