using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddLayerItemsHandler : IRequestHandler<AddLayerItemsCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public AddLayerItemsHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(AddLayerItemsCommand request, CancellationToken cancellationToken)
        {
            await _repository.AddLayerItemsAsync(request.Items);
            return true;
        }
    }
}
