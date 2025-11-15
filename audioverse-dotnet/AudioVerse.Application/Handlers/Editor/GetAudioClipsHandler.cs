using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class GetAudioClipsHandler : IRequestHandler<GetAudioClipsQuery, IEnumerable<AudioClip>>
    {
        private readonly IEditorRepository _repository;

        public GetAudioClipsHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<AudioClip>> Handle(GetAudioClipsQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetAudioClipsAsync(request.Skip, request.Take, request.Tag, request.Search);
        }
    }
}
