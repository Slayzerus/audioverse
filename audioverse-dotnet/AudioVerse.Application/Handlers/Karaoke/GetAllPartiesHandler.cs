using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetAllPartiesHandler : IRequestHandler<GetAllPartiesQuery, IEnumerable<KaraokeParty>>
    {
        private readonly IKaraokeRepository _repository;

        public GetAllPartiesHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<KaraokeParty>> Handle(GetAllPartiesQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetAllPartiesAsync();
        }
    }
}
