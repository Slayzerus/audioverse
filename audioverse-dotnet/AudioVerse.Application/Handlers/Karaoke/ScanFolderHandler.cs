using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers
{
    public class ScanFolderHandler : IRequestHandler<ScanFolderCommand, IEnumerable<KaraokeSongFile>>
    {
        private readonly IKaraokeRepository _repository;

        public ScanFolderHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<KaraokeSongFile>> Handle(ScanFolderCommand request, CancellationToken cancellationToken)
        {
            return await _repository.ScanFolderAsync(request.FolderPath);
        }
    }
}
