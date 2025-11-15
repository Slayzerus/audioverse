using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Queries.Karaoke
{
    public class GetAllPlayersHandler : IRequestHandler<GetAllPlayersQuery, IEnumerable<KaraokePlayer>>
    {
        private readonly IKaraokeRepository _repository;

        public GetAllPlayersHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<KaraokePlayer>> Handle(GetAllPlayersQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetAllPlayersAsync();
        }
    }
}