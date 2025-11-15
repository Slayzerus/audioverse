using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class RemoveTagFromAudioClipHandler : IRequestHandler<RemoveTagFromAudioClipCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public RemoveTagFromAudioClipHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(RemoveTagFromAudioClipCommand request, CancellationToken cancellationToken)
        {
            await _repository.RemoveTagFromAudioClipAsync(request.ClipId, request.Tag);
            return true;
        }
    }
}
