using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.User
{
    /// <summary>Handles updating user profile settings with audit logging.</summary>
    public class UpdateUserProfileSettingsHandler : IRequestHandler<UpdateUserProfileSettingsCommand, bool>
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IAuditLogService _auditLogService;

        public UpdateUserProfileSettingsHandler(IUserProfileRepository userProfileRepository, IAuditLogService auditLogService)
        {
            _userProfileRepository = userProfileRepository;
            _auditLogService = auditLogService;
        }

        public async Task<bool> Handle(UpdateUserProfileSettingsCommand request, CancellationToken cancellationToken)
        {
            var settings = await _userProfileRepository.GetUserProfileSettingsAsync(request.UserId);
            bool isNew = false;
            if (settings == null)
            {
                settings = new UserProfileSettings
                {
                    UserId = request.UserId
                };
                isNew = true;
            }

            // Prepare audit log description
            var changes = new List<string>();
            if (!isNew)
            {
                if (settings.DeveloperMode != request.DeveloperMode)
                    changes.Add($"DeveloperMode: {settings.DeveloperMode} -> {request.DeveloperMode}");
                if (settings.Jurors != request.Jurors)
                    changes.Add($"Jurors: {settings.Jurors} -> {request.Jurors}");
                if (settings.Fullscreen != request.Fullscreen)
                    changes.Add($"Fullscreen: {settings.Fullscreen} -> {request.Fullscreen}");
                if (settings.Theme != request.Theme)
                    changes.Add($"Theme: {settings.Theme} -> {request.Theme}");
                if (settings.SoundEffects != request.SoundEffects)
                    changes.Add($"SoundEffects: {settings.SoundEffects} -> {request.SoundEffects}");
                if (settings.Language != request.Language)
                    changes.Add($"Language: {settings.Language} -> {request.Language}");
                // New: track synced preference changes
                if (request.Difficulty != null && settings.Difficulty != request.Difficulty)
                    changes.Add($"Difficulty: {settings.Difficulty} -> {request.Difficulty}");
                if (request.PitchAlgorithm != null && settings.PitchAlgorithm != request.PitchAlgorithm)
                    changes.Add($"PitchAlgorithm: {settings.PitchAlgorithm} -> {request.PitchAlgorithm}");
                if (request.CompletedTutorials != null && settings.CompletedTutorials != request.CompletedTutorials)
                    changes.Add("CompletedTutorials updated");
                if (request.BreadcrumbsEnabled.HasValue && settings.BreadcrumbsEnabled != request.BreadcrumbsEnabled.Value)
                    changes.Add($"BreadcrumbsEnabled: {settings.BreadcrumbsEnabled} -> {request.BreadcrumbsEnabled}");
                if (request.KaraokeDisplaySettings != null && settings.KaraokeDisplaySettings != request.KaraokeDisplaySettings)
                    changes.Add("KaraokeDisplaySettings updated");
                if (request.PlayerKaraokeSettings != null && settings.PlayerKaraokeSettings != request.PlayerKaraokeSettings)
                    changes.Add("PlayerKaraokeSettings updated");
                if (request.GamepadMapping != null && settings.GamepadMapping != request.GamepadMapping)
                    changes.Add("GamepadMapping updated");
                if (request.CustomThemes != null && settings.CustomThemes != request.CustomThemes)
                    changes.Add("CustomThemes updated");
                if (request.LocalPlaylists != null && settings.LocalPlaylists != request.LocalPlaylists)
                    changes.Add("LocalPlaylists updated");
            }
            else
            {
                changes.Add($"Created settings: DeveloperMode={request.DeveloperMode}, Jurors={request.Jurors}, Fullscreen={request.Fullscreen}, Theme={request.Theme}, SoundEffects={request.SoundEffects}, Language={request.Language}");
            }

            // Apply existing fields
            settings.DeveloperMode = request.DeveloperMode;
            settings.Jurors = request.Jurors;
            settings.Fullscreen = request.Fullscreen;
            settings.Theme = request.Theme;
            settings.SoundEffects = request.SoundEffects;
            settings.Language = request.Language;

            // Apply new synced preferences (only if provided — null = "don't change")
            if (request.Difficulty != null) settings.Difficulty = request.Difficulty;
            if (request.PitchAlgorithm != null) settings.PitchAlgorithm = request.PitchAlgorithm;
            if (request.CompletedTutorials != null) settings.CompletedTutorials = request.CompletedTutorials;
            if (request.BreadcrumbsEnabled.HasValue) settings.BreadcrumbsEnabled = request.BreadcrumbsEnabled.Value;
            if (request.KaraokeDisplaySettings != null) settings.KaraokeDisplaySettings = request.KaraokeDisplaySettings;
            if (request.PlayerKaraokeSettings != null) settings.PlayerKaraokeSettings = request.PlayerKaraokeSettings;
            if (request.GamepadMapping != null) settings.GamepadMapping = request.GamepadMapping;
            if (request.CustomThemes != null) settings.CustomThemes = request.CustomThemes;
            if (request.LocalPlaylists != null) settings.LocalPlaylists = request.LocalPlaylists;

            if (isNew)
            {
                await _userProfileRepository.CreateUserProfileSettingsAsync(settings);
            }
            else
            {
                await _userProfileRepository.UpdateUserProfileSettingsAsync(settings);
            }

            if (changes.Count > 0)
            {
                var user = await _userProfileRepository.GetByIdAsync(request.UserId);
                await _auditLogService.LogActionAsync(
                    request.UserId,
                    user?.UserName ?? string.Empty,
                    "UpdateUserSettings",
                    string.Join(", ", changes),
                    true
                );
            }
            return true;
        }
    }
}
