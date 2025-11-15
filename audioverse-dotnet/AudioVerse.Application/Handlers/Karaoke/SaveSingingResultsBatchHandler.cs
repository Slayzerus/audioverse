using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Handlers
{
    public class SaveSingingResultsBatchHandler : IRequestHandler<SaveSingingResultsBatchCommand, bool>
    {
        private readonly IKaraokeRepository _repository;

        public SaveSingingResultsBatchHandler(IKaraokeRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(SaveSingingResultsBatchCommand request, CancellationToken cancellationToken)
        {
            var singingResults = new List<KaraokeSinging>();
            foreach (var result in request.Results)
            {
                singingResults.Add(result.Singing);
            }
            return await _repository.SaveSingingResultsAsync(singingResults);
        }
    }
}
