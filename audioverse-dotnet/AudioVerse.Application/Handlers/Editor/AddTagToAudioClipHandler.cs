using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddTagToAudioClipHandler : IRequestHandler<AddTagToAudioClipCommand, bool>
    {
        private readonly IEditorRepository _repository;

        public AddTagToAudioClipHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(AddTagToAudioClipCommand request, CancellationToken cancellationToken)
        {
            await _repository.AddTagToAudioClipAsync(request.ClipId, request.Tag);
            return true;
        }
    }
}
