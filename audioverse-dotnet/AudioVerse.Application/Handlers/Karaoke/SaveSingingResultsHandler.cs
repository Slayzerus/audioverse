using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Handlers
{
    public class SaveSingingResultsHandler : IRequestHandler<SaveSingingResultsCommand, bool>
    {
        private readonly IKaraokeRepository _repository;

        public SaveSingingResultsHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(SaveSingingResultsCommand request, CancellationToken cancellationToken)
        {
            return await _repository.SaveSingingResultsAsync(new List<KaraokeSinging> { request.Singing });
        }
    }
}
