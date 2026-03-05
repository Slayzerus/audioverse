using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class AddAudioClipHandler : IRequestHandler<AddAudioClipCommand, int>
    {
        private readonly IEditorRepository _repository;
        private readonly IFileStorage? _fileStorage;
        private const string Bucket = "audio-clips";

        public AddAudioClipHandler(IEditorRepository repository, IFileStorage? fileStorage = null)
        {
            _repository = repository;
            _fileStorage = fileStorage;
        }

        public async Task<int> Handle(AddAudioClipCommand request, CancellationToken cancellationToken)
        {
            string? objectKey = null;

            if (request.Data != null && _fileStorage != null)
            {
                await _fileStorage.EnsureBucketExistsAsync(Bucket, cancellationToken);
                objectKey = $"{Guid.NewGuid():N}/{request.FileName}";
                var contentType = request.FileFormat switch
                {
                    "mp3" => "audio/mpeg",
                    "wav" => "audio/wav",
                    "ogg" => "audio/ogg",
                    "flac" => "audio/flac",
                    _ => "application/octet-stream"
                };
                await _fileStorage.UploadAsync(Bucket, objectKey, request.Data, contentType, cancellationToken);
            }

            var clip = new AudioClip
            {
                UserProfileId = request.UserProfileId,
                FileName = request.FileName,
                FileFormat = request.FileFormat,
                ObjectKey = objectKey,
                Duration = request.Duration,
                Size = request.Size
            };

            return await _repository.AddAudioClipAsync(clip);
        }
    }
}
