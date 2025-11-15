using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.Karaoke;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Queries.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetPartyByIdHandler : IRequestHandler<GetPartyByIdQuery, KaraokeParty?>
    {
        private readonly IKaraokeRepository _repository;

        public GetPartyByIdHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<KaraokeParty?> Handle(GetPartyByIdQuery request, CancellationToken cancellationToken)
        {
            return await _repository.GetPartyByIdAsync(request.Id);
        }
    }
}
