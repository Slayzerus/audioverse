using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Services;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class ParseUltrastarFileHandler : IRequestHandler<ParseUltrastarFileCommand, KaraokeSongFile?>
    {
        private readonly IKaraokeRepository _repository;
        private readonly ISongMatchingService? _songMatching;
        private readonly ILogger<ParseUltrastarFileHandler> _logger;

        public ParseUltrastarFileHandler(
            IKaraokeRepository repository,
            ILogger<ParseUltrastarFileHandler> logger,
            ISongMatchingService? songMatching = null)
        {
            _repository = repository;
            _logger = logger;
            _songMatching = songMatching;
        }

        public async Task<KaraokeSongFile?> Handle(ParseUltrastarFileCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation($"Parsing Ultrastar file {request.FileName}");
            var song = await _repository.ParseUltrastarSong(request.Data, request.FileName);

            if (song != null && _songMatching != null)
            {
                try
                {
                    await _songMatching.MatchAndLinkAsync(song, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Nie udało się dopasować piosenki '{Title}' do katalogu audio", song.Title);
                }
            }

            return song;
        }
    }
}
