using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Services;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class ScanFolderHandler : IRequestHandler<ScanFolderCommand, IEnumerable<KaraokeSongFile>>
    {
        private readonly IKaraokeRepository _repository;
        private readonly ISongMatchingService? _songMatching;
        private readonly ILogger<ScanFolderHandler> _logger;

        public ScanFolderHandler(
            IKaraokeRepository repository,
            ILogger<ScanFolderHandler> logger,
            ISongMatchingService? songMatching = null)
        {
            _repository = repository;
            _logger = logger;
            _songMatching = songMatching;
        }

        public async Task<IEnumerable<KaraokeSongFile>> Handle(ScanFolderCommand request, CancellationToken cancellationToken)
        {
            var scannedSongs = await _repository.ScanFolderAsync(request.FolderPath);

            if (scannedSongs.Any())
            {
                await _repository.AddKaraokeSongFilesAsync(scannedSongs);

                if (_songMatching != null)
                {
                    try
                    {
                        await _songMatching.MatchAndLinkBatchAsync(scannedSongs, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Błąd batch-dopasowywania piosenek do katalogu audio");
                    }
                }
            }

            return scannedSongs;
        }
    }
}
