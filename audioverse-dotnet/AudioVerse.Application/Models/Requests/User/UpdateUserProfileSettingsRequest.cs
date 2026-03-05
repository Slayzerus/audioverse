namespace AudioVerse.Application.Models.Requests.User
{
    /// <summary>Request DTO for updating user profile settings.</summary>
    public class UpdateUserProfileSettingsRequest
    {
        // ── Existing ───────────────────────────────────────────────
        public bool DeveloperMode { get; set; }
        public bool Jurors { get; set; }
        public bool Fullscreen { get; set; }
        public string Theme { get; set; } = "light";
        public bool SoundEffects { get; set; } = true;
        public string Language { get; set; } = "pl";

        // ── New synced preferences ─────────────────────────────────
        public string? Difficulty { get; set; }
        public string? PitchAlgorithm { get; set; }
        public string? CompletedTutorials { get; set; }
        public bool? BreadcrumbsEnabled { get; set; }
        public string? KaraokeDisplaySettings { get; set; }
        public string? PlayerKaraokeSettings { get; set; }
        public string? GamepadMapping { get; set; }
        public string? CustomThemes { get; set; }
        public string? LocalPlaylists { get; set; }
    }
}
