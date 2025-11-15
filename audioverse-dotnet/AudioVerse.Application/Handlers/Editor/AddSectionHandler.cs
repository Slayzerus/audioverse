using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddSectionHandler : IRequestHandler<AddSectionCommand, int>
    {
        private readonly IEditorRepository _repository;

        public AddSectionHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddSectionCommand request, CancellationToken cancellationToken)
        {
            var section = new AudioSection
            {
                ProjectId = request.ProjectId,
                Name = request.Name,
                OrderNumber = request.OrderNumber
            };

            return await _repository.AddSectionAsync(section);
        }
    }
}
