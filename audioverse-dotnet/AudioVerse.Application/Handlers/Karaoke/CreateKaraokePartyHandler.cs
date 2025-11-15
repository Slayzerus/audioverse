using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Commands.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class CreateKaraokePartyHandler : IRequestHandler<CreateKaraokePartyCommand, int>
    {
        private readonly IKaraokeRepository _repository;

        public CreateKaraokePartyHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(CreateKaraokePartyCommand request, CancellationToken cancellationToken)
        {
            return await _repository.CreatePartyAsync(request.Party);
        }
    }
}
