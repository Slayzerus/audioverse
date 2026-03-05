using System.Text.Json;
using MediatR;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Admin
{
    public class SaveScoringPresetsHandler : IRequestHandler<SaveScoringPresetsCommand, bool>
    {
        private readonly ISystemConfigRepository _configRepository;

        public SaveScoringPresetsHandler(ISystemConfigRepository configRepository) => _configRepository = configRepository;

        public async Task<bool> Handle(SaveScoringPresetsCommand request, CancellationToken cancellationToken)
        {
            var json = JsonSerializer.Serialize(request.Presets, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var preset = new ScoringPreset
            {
                DataJson = json,
                ModifiedAt = DateTime.UtcNow,
                ModifiedByUserId = request.ModifiedByUserId,
                ModifiedByUsername = request.ModifiedByUsername ?? "unknown"
            };
            await _configRepository.SaveScoringPresetAsync(preset);
            return true;
        }
    }
}
