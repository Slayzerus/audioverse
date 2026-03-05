using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class DeleteSectionHandler : IRequestHandler<DeleteSectionCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public DeleteSectionHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(DeleteSectionCommand request, CancellationToken cancellationToken)
        {
            return await _repository.DeleteSectionAsync(request.Id);
        }
    }
}
