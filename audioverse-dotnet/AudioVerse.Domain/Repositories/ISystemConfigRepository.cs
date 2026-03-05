using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Auth;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for system configuration and password requirements.
/// </summary>
public interface ISystemConfigRepository
{
    // ????????????????????????????????????????????????????????????
    //  SYSTEM CONFIGURATION
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Gets the currently active system configuration.
    /// </summary>
    Task<SystemConfiguration?> GetActiveConfigAsync();

    /// <summary>
    /// Gets a configuration value by key.
    /// </summary>
    /// <param name="key">The configuration key</param>
    /// <returns>The configuration entry, or null if not found</returns>
    Task<SystemConfiguration?> GetByKeyAsync(string key);

    /// <summary>
    /// Gets all system configuration entries.
    /// </summary>
    Task<IEnumerable<SystemConfiguration>> GetAllAsync();

    /// <summary>
    /// Sets a configuration value, creating if it doesn't exist.
    /// </summary>
    /// <param name="key">The configuration key</param>
    /// <param name="value">The configuration value</param>
    /// <returns>True if set successfully</returns>
    Task<bool> SetValueAsync(string key, string value);

    /// <summary>
    /// Deletes a configuration entry.
    /// </summary>
    /// <param name="key">The configuration key</param>
    /// <returns>True if deleted</returns>
    Task<bool> DeleteAsync(string key);

    // ????????????????????????????????????????????????????????????
    //  PASSWORD REQUIREMENTS
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Gets the current password requirements.
    /// </summary>
    Task<PasswordRequirements?> GetPasswordRequirementsAsync();

    /// <summary>
    /// Updates password requirements.
    /// </summary>
    /// <param name="requirements">The new requirements</param>
    /// <returns>True if updated</returns>
    Task<bool> UpdatePasswordRequirementsAsync(PasswordRequirements requirements);

    // ????????????????????????????????????????????????????????????
    //  SCORING PRESETS
    // ????????????????????????????????????????????????????????????

    /// <summary>
    /// Gets all scoring presets.
    /// </summary>
    Task<IEnumerable<ScoringPreset>> GetScoringPresetsAsync();

    /// <summary>
    /// Gets a scoring preset by ID.
    /// </summary>
    Task<ScoringPreset?> GetScoringPresetByIdAsync(int id);

    /// <summary>
    /// Saves a scoring preset (create or update).
    /// </summary>
    Task<int> SaveScoringPresetAsync(ScoringPreset preset);

    /// <summary>
    /// Deletes a scoring preset.
    /// </summary>
    Task<bool> DeleteScoringPresetAsync(int id);

    /// <summary>
    /// Creates a new system configuration and deactivates previous ones.
    /// </summary>
    /// <param name="config">The new configuration</param>
    /// <returns>The ID of the created configuration</returns>
    Task<int> CreateConfigAsync(SystemConfiguration config);

    /// <summary>
    /// Gets radio station IDs that have MaxListeners higher than the given limit.
    /// </summary>
    Task<IEnumerable<int>> GetStationsExceedingListenerLimitAsync(int maxListeners);

    /// <summary>
    /// Gets the count of currently active radio listeners.
    /// </summary>
    Task<int> GetActiveListenerCountAsync();

    /// <summary>
    /// Adds an audit log entry.
    /// </summary>
    Task AddAuditLogAsync(AuditLog auditLog);

    // ──────────────────────────────────────────────────
    //  FEATURE VISIBILITY OVERRIDES
    // ──────────────────────────────────────────────────

    /// <summary>Pobiera nadpisania widoczności feature'ów dla aktywnej konfiguracji.</summary>
    Task<IEnumerable<FeatureVisibilityOverride>> GetFeatureOverridesAsync(CancellationToken ct = default);

    /// <summary>Zbiorczy AddOrUpdate — upsert listy nadpisań (zastępuje istniejące dla aktywnej konfiguracji).</summary>
    Task<int> UpsertFeatureOverridesAsync(IEnumerable<FeatureVisibilityOverride> overrides, CancellationToken ct = default);
}
