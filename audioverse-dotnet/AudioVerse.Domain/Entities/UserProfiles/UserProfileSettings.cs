namespace AudioVerse.Domain.Entities.UserProfiles
{
    /// <summary>
    /// User profile settings (UI preferences, sound, language, modes).
    /// Extended with fields synced from frontend (previously localStorage-only).
    /// </summary>
    public class UserProfileSettings
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        // ── Existing settings ─────────────────────────────────────
        public bool DeveloperMode { get; set; } = false;
        public bool Jurors { get; set; } = false;
        public bool Fullscreen { get; set; } = false;
        public string Theme { get; set; } = "light";
        public bool SoundEffects { get; set; } = true;
        public string Language { get; set; } = "pl";

        // ── New synced preferences (previously localStorage-only) ──
        /// <summary>Karaoke difficulty: easy / normal / hard</summary>
        public string? Difficulty { get; set; }
        /// <summary>Default pitch detection algorithm: autocorr / pitchy / crepe / librosa</summary>
        public string? PitchAlgorithm { get; set; }
        /// <summary>JSON array of completed tutorial page IDs</summary>
        public string? CompletedTutorials { get; set; }
        /// <summary>User-level breadcrumb visibility preference</summary>
        public bool BreadcrumbsEnabled { get; set; } = true;
        /// <summary>Karaoke display visual settings (JSON blob)</summary>
        public string? KaraokeDisplaySettings { get; set; }
        /// <summary>Per-player karaoke bar visual settings (JSON blob)</summary>
        public string? PlayerKaraokeSettings { get; set; }
        /// <summary>Gamepad button mapping (JSON blob)</summary>
        public string? GamepadMapping { get; set; }
        /// <summary>Custom theme definitions catalog (JSON blob)</summary>
        public string? CustomThemes { get; set; }
        /// <summary>Local playlists (JSON blob)</summary>
        public string? LocalPlaylists { get; set; }

        public UserProfile? User { get; set; }
    }
}
