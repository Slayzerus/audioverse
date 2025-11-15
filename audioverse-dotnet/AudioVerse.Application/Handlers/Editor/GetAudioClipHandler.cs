using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class GetAudioClipHandler : IRequestHandler<GetAudioClipQuery, AudioClip?>
    {
        private readonly IEditorRepository _repository;

        public GetAudioClipHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<AudioClip?> Handle(GetAudioClipQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetAudioClipAsync(request.ClipId);
        }
    }
}
