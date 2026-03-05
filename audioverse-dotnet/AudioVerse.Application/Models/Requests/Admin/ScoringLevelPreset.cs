namespace AudioVerse.Application.Models.Requests.Admin
{
    public class ScoringLevelPreset
    {
        public int SemitoneTolerance { get; set; }
        public double PreWindow { get; set; }
        public double PostExtra { get; set; }
        public double DifficultyMult { get; set; }
    }
}
