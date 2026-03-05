using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Services;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

public class PlayerProgressService : IPlayerProgressService
{
    private readonly AudioVerseDbContext _db;
    private readonly ILogger<PlayerProgressService> _logger;

    public PlayerProgressService(AudioVerseDbContext db, ILogger<PlayerProgressService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<(int NewXp, int NewLevel, bool LeveledUp)> AddXpAsync(
        int playerId, ProgressCategory category, int amount, string source, int? referenceId, CancellationToken ct)
    {
        var progress = await _db.PlayerProgress
            .FirstOrDefaultAsync(p => p.PlayerId == playerId && p.Category == category, ct);

        if (progress == null)
        {
            progress = new PlayerProgress
            {
                PlayerId = playerId,
                Category = category,
                Xp = 0,
                Level = 1,
                XpToNextLevel = CalculateXpToNextLevel(1)
            };
            _db.PlayerProgress.Add(progress);
        }

        var oldLevel = progress.Level;
        progress.Xp += amount;
        progress.UpdatedAt = DateTime.UtcNow;

        while (progress.Xp >= progress.XpToNextLevel)
        {
            progress.Xp -= progress.XpToNextLevel;
            progress.Level++;
            progress.XpToNextLevel = CalculateXpToNextLevel(progress.Level);
        }

        _db.XpTransactions.Add(new XpTransaction
        {
            PlayerId = playerId,
            Category = category,
            Amount = amount,
            Source = source,
            ReferenceId = referenceId
        });

        await _db.SaveChangesAsync(ct);

        var leveledUp = progress.Level > oldLevel;
        if (leveledUp)
            _logger.LogInformation("Gracz {PlayerId} awansował na poziom {Level} w kategorii {Category}", playerId, progress.Level, category);

        return (progress.Xp, progress.Level, leveledUp);
    }

    public async Task<IEnumerable<PlayerProgress>> GetProgressAsync(int playerId, CancellationToken ct)
    {
        return await _db.PlayerProgress
            .Where(p => p.PlayerId == playerId)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<PlayerSkill>> GetPlayerSkillsAsync(int playerId, CancellationToken ct)
    {
        return await _db.PlayerSkills
            .Include(ps => ps.SkillDefinition)
            .Where(ps => ps.PlayerId == playerId)
            .ToListAsync(ct);
    }

    public async Task<bool> UnlockSkillAsync(int playerId, int skillDefinitionId, int? campaignId, CancellationToken ct)
    {
        var exists = await _db.PlayerSkills
            .AnyAsync(ps => ps.PlayerId == playerId && ps.SkillDefinitionId == skillDefinitionId, ct);
        if (exists) return false;

        _db.PlayerSkills.Add(new PlayerSkill
        {
            PlayerId = playerId,
            SkillDefinitionId = skillDefinitionId,
            UnlockedInCampaignId = campaignId
        });
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Formuła XP: 100 * level^1.5 (zaokrąglone).</summary>
    private static int CalculateXpToNextLevel(int currentLevel)
        => (int)(100 * Math.Pow(currentLevel, 1.5));
}
