using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class UpdateProjectHandler : IRequestHandler<UpdateProjectCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public UpdateProjectHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
        {
            var entity = new AudioProject
            {
                Id = request.Id,
                Name = request.Name,
                IsTemplate = request.IsTemplate,
                Volume = request.Volume
            };
            return await _repository.UpdateProjectAsync(entity);
        }
    }
}
