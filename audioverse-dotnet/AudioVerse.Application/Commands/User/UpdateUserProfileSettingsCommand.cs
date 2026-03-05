using MediatR;

namespace AudioVerse.Application.Commands.User
{
    /// <summary>Update user profile settings (UI, sound, synced preferences).</summary>
    public record UpdateUserProfileSettingsCommand(
        int UserId,
        bool DeveloperMode,
        bool Jurors,
        bool Fullscreen,
        string Theme,
        bool SoundEffects,
        string Language,
        // ── New synced preferences ────
        string? Difficulty,
        string? PitchAlgorithm,
        string? CompletedTutorials,
        bool? BreadcrumbsEnabled,
        string? KaraokeDisplaySettings,
        string? PlayerKaraokeSettings,
        string? GamepadMapping,
        string? CustomThemes,
        string? LocalPlaylists
    ) : IRequest<bool>;
}
