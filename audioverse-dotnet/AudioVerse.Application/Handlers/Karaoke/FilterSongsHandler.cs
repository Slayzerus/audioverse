using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Application.Queries.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class FilterSongsHandler : IRequestHandler<FilterSongsQuery, IEnumerable<KaraokeSongFile>>
    {
        private readonly IKaraokeRepository _repository;

        public FilterSongsHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<KaraokeSongFile>> Handle(FilterSongsQuery request, CancellationToken cancellationToken)
        {
            return await _repository.FilterSongsAsync(request.Title, request.Artist, request.Genre, request.Language, request.Year);
        }
    }
}
