using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class DeleteProjectHandler : IRequestHandler<DeleteProjectCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public DeleteProjectHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
        {
            return await _repository.DeleteProjectAsync(request.Id);
        }
    }
}
