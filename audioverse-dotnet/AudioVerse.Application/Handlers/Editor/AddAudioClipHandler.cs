using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddAudioClipHandler : IRequestHandler<AddAudioClipCommand, int>
    {
        private readonly IEditorRepository _repository;

        public AddAudioClipHandler(IEditorRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(AddAudioClipCommand request, CancellationToken cancellationToken)
        {
            var clip = new AudioClip
            {
                UserProfileId = request.UserProfileId,
                FileName = request.FileName,
                FileFormat = request.FileFormat,
                Data = request.Data,
                Duration = request.Duration,
                Size = request.Size
            };

            return await _repository.AddAudioClipAsync(clip);
        }
    }
}
