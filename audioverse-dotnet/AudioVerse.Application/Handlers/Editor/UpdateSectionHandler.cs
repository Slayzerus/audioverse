using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class UpdateSectionHandler : IRequestHandler<UpdateSectionCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public UpdateSectionHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(UpdateSectionCommand request, CancellationToken cancellationToken)
        {
            var entity = new AudioSection
            {
                Id = request.Id,
                Name = request.Name,
                OrderNumber = request.OrderNumber
            };
            return await _repository.UpdateSectionAsync(entity);
        }
    }
}
