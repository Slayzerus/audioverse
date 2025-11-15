using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddLayerItemHandler : IRequestHandler<AddLayerItemCommand, int>
    {
        private readonly IEditorRepository _repository;

        public AddLayerItemHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddLayerItemCommand request, CancellationToken cancellationToken)
        {
            var item = new AudioLayerItem
            {
                LayerId = request.LayerId,
                StartTime = request.StartTime,
                Parameters = request.Parameters
            };

            return await _repository.AddLayerItemAsync(item);
        }
    }
}
