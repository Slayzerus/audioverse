using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Application.Queries.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetAllSongsHandler : IRequestHandler<GetAllSongsQuery, IEnumerable<KaraokeSongFile>>
    {
        private readonly IKaraokeRepository _repository;

        public GetAllSongsHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<KaraokeSongFile>> Handle(GetAllSongsQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetAllSongsAsync();
        }
    }
}
