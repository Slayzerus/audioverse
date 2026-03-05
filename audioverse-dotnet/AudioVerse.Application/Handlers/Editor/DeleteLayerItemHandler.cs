using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class DeleteLayerItemHandler : IRequestHandler<DeleteLayerItemCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public DeleteLayerItemHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(DeleteLayerItemCommand request, CancellationToken cancellationToken)
        {
            return await _repository.DeleteLayerItemAsync(request.Id);
        }
    }
}
