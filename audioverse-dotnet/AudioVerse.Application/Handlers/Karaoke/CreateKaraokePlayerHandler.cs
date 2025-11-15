using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Commands.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class CreateKaraokePlayerHandler : IRequestHandler<CreateKaraokePlayerCommand, int>
    {
        private readonly IKaraokeRepository _repository;

        public CreateKaraokePlayerHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(CreateKaraokePlayerCommand request, CancellationToken cancellationToken)
        {
            return await _repository.CreatePlayerAsync(request.Player);
        }
    }
}
