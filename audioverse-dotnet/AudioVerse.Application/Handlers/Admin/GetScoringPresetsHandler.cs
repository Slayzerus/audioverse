using System.Text.Json;
using MediatR;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetScoringPresetsHandler : IRequestHandler<GetScoringPresetsQuery, string>
    {
        private readonly ISystemConfigRepository _configRepository;

        public GetScoringPresetsHandler(ISystemConfigRepository configRepository) => _configRepository = configRepository;

        public async Task<string> Handle(GetScoringPresetsQuery request, CancellationToken cancellationToken)
        {
            var presets = await _configRepository.GetScoringPresetsAsync();
            var preset = presets.OrderByDescending(p => p.ModifiedAt).FirstOrDefault();
            if (preset == null) return JsonSerializer.Serialize(new
            {
                easy = new { semitoneTolerance = 2, preWindow = 0.25, postExtra = 0.3, difficultyMult = 0.9 },
                normal = new { semitoneTolerance = 1, preWindow = 0.15, postExtra = 0.2, difficultyMult = 1.0 },
                hard = new { semitoneTolerance = 0, preWindow = 0.08, postExtra = 0.12, difficultyMult = 1.05 }
            });
            return preset.DataJson;
        }
    }
}
