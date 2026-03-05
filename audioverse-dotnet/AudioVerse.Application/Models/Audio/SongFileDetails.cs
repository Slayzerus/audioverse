namespace AudioVerse.Application.Models.Audio
{
    public sealed class SongFileDetails
    {
        // Ogólne
        public double DurationAnalyzedSec { get; init; }

        // Głośność
        public double RmsDbfs { get; init; }           // średnia głośność (dBFS)
        public double PeakDbfs { get; init; }          // szczyt (dBFS)
        public double ZeroCrossingRate { get; init; }  // 0..1

        // Rytm / tempo
        public double? EstimatedBpm { get; init; }

        // Wysokość dźwięku (pitch monofoniczny)
        public double? EstimatedPitchHz { get; init; }

        // Prosty opis słowny na szybko
        public string LoudnessHint { get; init; } = "";
    }
}
