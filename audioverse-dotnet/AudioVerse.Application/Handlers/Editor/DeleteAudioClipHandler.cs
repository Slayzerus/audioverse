using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Editor
{
    public class DeleteAudioClipHandler : IRequestHandler<DeleteAudioClipCommand, bool>
    {
        private readonly IEditorRepository _repository;
        private readonly IFileStorage? _fileStorage;
        private const string Bucket = "audio-clips";

        public DeleteAudioClipHandler(IEditorRepository repository, IFileStorage? fileStorage = null)
        {
            _repository = repository;
            _fileStorage = fileStorage;
        }

        public async Task<bool> Handle(DeleteAudioClipCommand request, CancellationToken cancellationToken)
        {
            var clip = await _repository.GetAudioClipAsync(request.Id);
            if (clip == null) return false;

            if (!string.IsNullOrEmpty(clip.ObjectKey) && _fileStorage != null)
            {
                try { await _fileStorage.DeleteAsync(Bucket, clip.ObjectKey, cancellationToken); } catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException) { }
            }

            return await _repository.DeleteAudioClipAsync(request.Id);
        }
    }
}
