namespace AudioVerse.Application.Models.Requests.Admin
{
    public class ScoringPresetsRequest
    {
        public ScoringLevelPreset Easy { get; set; } = new ScoringLevelPreset();
        public ScoringLevelPreset Normal { get; set; } = new ScoringLevelPreset();
        public ScoringLevelPreset Hard { get; set; } = new ScoringLevelPreset();
    }
}
