using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class ParseUltrastarFileHandler : IRequestHandler<ParseUltrastarFileCommand, KaraokeSongFile?>
    {
        private readonly IKaraokeRepository _repository;
        private readonly ILogger<ParseUltrastarFileHandler> _logger;

        public ParseUltrastarFileHandler(IKaraokeRepository repository, ILogger<ParseUltrastarFileHandler> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<KaraokeSongFile?> Handle(ParseUltrastarFileCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation($"Parsing Ultrastar file {request.FileName}");
            return await _repository.ParseUltrastarSong(request.Data, request.FileName);
        }
    }
}
