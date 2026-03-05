using MediatR;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Services;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class SaveSingingResultsBatchHandler : IRequestHandler<SaveSingingResultsBatchCommand, bool>
    {
        private readonly IKaraokeRepository _repository;
        private readonly IPlayerProgressService? _progress;
        private readonly ILogger<SaveSingingResultsBatchHandler> _logger;

        public SaveSingingResultsBatchHandler(IKaraokeRepository repository, ILogger<SaveSingingResultsBatchHandler> logger, IPlayerProgressService? progress = null)
        {
            _repository = repository;
            _progress = progress;
            _logger = logger;
        }

        public async Task<bool> Handle(SaveSingingResultsBatchCommand request, CancellationToken cancellationToken)
        {
            var singingResults = new List<KaraokeSinging>();
            foreach (var result in request.Results)
            {
                singingResults.Add(result.Singing);
            }
            var saved = await _repository.SaveSingingResultsAsync(singingResults);

            if (saved && _progress != null)
            {
                foreach (var singing in singingResults)
                {
                    try
                    {
                        var xp = CalculateXp(singing.Score, singing.Perfect, singing.Combo);
                        if (xp > 0)
                            await _progress.AddXpAsync(singing.PlayerId, ProgressCategory.Karaoke, xp, "singing", singing.Id, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Nie udało się przyznać XP graczowi {PlayerId} za singing {SingingId}", singing.PlayerId, singing.Id);
                    }
                }
            }

            return saved;
        }

        private static int CalculateXp(int score, int perfect, int combo)
        {
            // Bazowe XP: 10 za śpiewanie + 1 za każde 1000 pkt + bonus za perfect/combo
            var xp = 10 + (score / 1000);
            xp += perfect / 10;
            xp += combo / 20;
            return Math.Max(1, xp);
        }
    }
}
