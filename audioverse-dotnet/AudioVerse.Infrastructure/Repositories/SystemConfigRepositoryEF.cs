using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of ISystemConfigRepository.
/// Handles system configuration and password requirements.
/// </summary>
public class SystemConfigRepositoryEF : ISystemConfigRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<SystemConfigRepositoryEF> _logger;

    public SystemConfigRepositoryEF(AudioVerseDbContext dbContext, ILogger<SystemConfigRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    // ????????????????????????????????????????????????????????????
    //  SYSTEM CONFIGURATION
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<SystemConfiguration?> GetActiveConfigAsync()
    {
        return await _dbContext.SystemConfigurations
            .Include(c => c.FeatureVisibilityOverrides)
            .Where(c => c.Active)
            .OrderByDescending(c => c.ModifiedAt)
            .FirstOrDefaultAsync();
    }

    /// <inheritdoc />
    public async Task<SystemConfiguration?> GetByKeyAsync(string key)
    {
        // SystemConfiguration uses Active flag, not Key/Value pattern
        // Return the active configuration
        return await GetActiveConfigAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<SystemConfiguration>> GetAllAsync()
    {
        return await _dbContext.SystemConfigurations
            .OrderByDescending(c => c.ModifiedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> SetValueAsync(string key, string value)
    {
        // This method is not applicable to the current SystemConfiguration structure
        // which uses specific typed properties instead of key/value pairs
        _logger.LogWarning("SetValueAsync not applicable to current SystemConfiguration structure");
        return false;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(string key)
    {
        // Not applicable to current structure
        return false;
    }

    /// <summary>
    /// Gets the currently active system configuration.
    /// </summary>
    public async Task<SystemConfiguration?> GetActiveConfigurationAsync()
    {
        return await _dbContext.SystemConfigurations
            .FirstOrDefaultAsync(c => c.Active);
    }

    /// <summary>
    /// Updates the system configuration, creating a new version.
    /// </summary>
    public async Task<bool> UpdateConfigurationAsync(SystemConfiguration config, int modifiedByUserId, string? modifiedByUsername)
    {
        // Deactivate current active configuration
        var currentActive = await _dbContext.SystemConfigurations
            .FirstOrDefaultAsync(c => c.Active);

        if (currentActive != null)
        {
            currentActive.Active = false;
        }

        // Create new active configuration
        config.Active = true;
        config.ModifiedAt = DateTime.UtcNow;
        config.ModifiedByUserId = modifiedByUserId;
        config.ModifiedByUsername = modifiedByUsername;

        _dbContext.SystemConfigurations.Add(config);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("System configuration updated by user {UserId}", modifiedByUserId);
        return true;
    }

    // ????????????????????????????????????????????????????????????
    //  PASSWORD REQUIREMENTS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<PasswordRequirements?> GetPasswordRequirementsAsync()
    {
        return await _dbContext.PasswordRequirements
            .FirstOrDefaultAsync(p => p.Active);
    }

    /// <inheritdoc />
    public async Task<bool> UpdatePasswordRequirementsAsync(PasswordRequirements requirements)
    {
        var existing = await _dbContext.PasswordRequirements.FirstOrDefaultAsync(p => p.Active);

        if (existing != null)
        {
            existing.MinLength = requirements.MinLength;
            existing.MaxLength = requirements.MaxLength;
            existing.RequireUppercase = requirements.RequireUppercase;
            existing.RequireLowercase = requirements.RequireLowercase;
            existing.RequireDigit = requirements.RequireDigit;
            existing.RequireSpecialChar = requirements.RequireSpecialChar;
            existing.Description = requirements.Description;
        }
        else
        {
            requirements.Active = true;
            _dbContext.PasswordRequirements.Add(requirements);
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Password requirements updated");
        return true;
    }

    // ????????????????????????????????????????????????????????????
    //  SCORING PRESETS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<IEnumerable<ScoringPreset>> GetScoringPresetsAsync()
    {
        return await _dbContext.AdminScoringPresets
            .OrderByDescending(p => p.ModifiedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<ScoringPreset?> GetScoringPresetByIdAsync(int id)
    {
        return await _dbContext.AdminScoringPresets.FindAsync(id);
    }

    /// <inheritdoc />
    public async Task<int> SaveScoringPresetAsync(ScoringPreset preset)
    {
        preset.ModifiedAt = DateTime.UtcNow;
        
        if (preset.Id == 0)
        {
            _dbContext.AdminScoringPresets.Add(preset);
        }
        else
        {
            _dbContext.AdminScoringPresets.Update(preset);
        }

        await _dbContext.SaveChangesAsync();
        return preset.Id;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteScoringPresetAsync(int id)
    {
        var preset = await _dbContext.AdminScoringPresets.FindAsync(id);
        if (preset == null) return false;

        _dbContext.AdminScoringPresets.Remove(preset);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<int> CreateConfigAsync(SystemConfiguration config)
    {
        // Deactivate previous active configs
        var activeConfigs = await _dbContext.SystemConfigurations
            .Where(c => c.Active)
            .ToListAsync();

        foreach (var cfg in activeConfigs)
        {
            cfg.Active = false;
        }

        _dbContext.SystemConfigurations.Add(config);
        await _dbContext.SaveChangesAsync();
        return config.Id;
    }

    public async Task<IEnumerable<int>> GetStationsExceedingListenerLimitAsync(int maxListeners)
    {
        return await _dbContext.RadioStations
            .Where(r => r.MaxListeners.HasValue && r.MaxListeners.Value > maxListeners)
            .Select(r => r.Id)
            .ToListAsync();
    }

    public async Task<int> GetActiveListenerCountAsync()
    {
        return await _dbContext.RadioListeners.CountAsync(l => l.DisconnectedAtUtc == null);
    }

    public async Task AddAuditLogAsync(AudioVerse.Domain.Entities.Admin.AuditLog auditLog)
    {
        _dbContext.AuditLogs.Add(auditLog);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<IEnumerable<FeatureVisibilityOverride>> GetFeatureOverridesAsync(CancellationToken ct = default)
    {
        var active = await _dbContext.SystemConfigurations
            .Where(c => c.Active)
            .OrderByDescending(c => c.Id)
            .FirstOrDefaultAsync(ct);
        if (active == null) return [];

        return await _dbContext.FeatureVisibilityOverrides
            .Where(f => f.SystemConfigurationId == active.Id)
            .OrderBy(f => f.FeatureId)
            .ToListAsync(ct);
    }

    public async Task<int> UpsertFeatureOverridesAsync(IEnumerable<FeatureVisibilityOverride> overrides, CancellationToken ct = default)
    {
        var active = await _dbContext.SystemConfigurations
            .Where(c => c.Active)
            .OrderByDescending(c => c.Id)
            .FirstOrDefaultAsync(ct);
        if (active == null) return 0;

        var existing = await _dbContext.FeatureVisibilityOverrides
            .Where(f => f.SystemConfigurationId == active.Id)
            .ToListAsync(ct);

        var incomingIds = overrides.Select(o => o.FeatureId).ToHashSet();

        // Usuń te, których nie ma w nowej liście
        var toRemove = existing.Where(e => !incomingIds.Contains(e.FeatureId)).ToList();
        _dbContext.FeatureVisibilityOverrides.RemoveRange(toRemove);

        foreach (var incoming in overrides)
        {
            var match = existing.FirstOrDefault(e => e.FeatureId == incoming.FeatureId);
            if (match != null)
            {
                match.Hidden = incoming.Hidden;
                match.VisibleToRoles = incoming.VisibleToRoles;
            }
            else
            {
                _dbContext.FeatureVisibilityOverrides.Add(new FeatureVisibilityOverride
                {
                    SystemConfigurationId = active.Id,
                    FeatureId = incoming.FeatureId,
                    Hidden = incoming.Hidden,
                    VisibleToRoles = incoming.VisibleToRoles
                });
            }
        }

        return await _dbContext.SaveChangesAsync(ct);
    }
}
