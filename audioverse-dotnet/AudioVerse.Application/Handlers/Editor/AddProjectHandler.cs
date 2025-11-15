using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddProjectHandler : IRequestHandler<AddProjectCommand, int>
    {
        private readonly IEditorRepository _repository;

        public AddProjectHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddProjectCommand request, CancellationToken cancellationToken)
        {
            var project = new AudioProject
            {
                Name = request.Name,
                UserProfileId = request.UserProfileId
            };

            return await _repository.AddProjectAsync(project);
        }
    }
}
