using MediatR;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Queries;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Handlers
{
    public class GetPartyWithPlayersHandler : IRequestHandler<GetPartyWithPlayersQuery, KaraokeParty?>
    {
        private readonly IKaraokeRepository _repository;

        public GetPartyWithPlayersHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<KaraokeParty?> Handle(GetPartyWithPlayersQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetPartyWithPlayersAsync(request.PartyId);
        }
    }
}
