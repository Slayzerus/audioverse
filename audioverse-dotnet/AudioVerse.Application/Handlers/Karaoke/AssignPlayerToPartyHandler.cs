using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Commands.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class AssignPlayerToPartyHandler : IRequestHandler<AssignPlayerToPartyCommand, bool>
    {
        private readonly IKaraokeRepository _repository;

        public AssignPlayerToPartyHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(AssignPlayerToPartyCommand request, CancellationToken cancellationToken)
        {
            return await _repository.AssignPlayerToPartyAsync(request.PartyPlayer);
        }
    }
}
