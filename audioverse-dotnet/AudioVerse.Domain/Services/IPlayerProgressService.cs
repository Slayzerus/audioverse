using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Services;

/// <summary>
/// Serwis zarządzania postępem gracza — XP, poziomy, skille.
/// </summary>
public interface IPlayerProgressService
{
    /// <summary>Dodaj XP graczowi w danej kategorii. Automatycznie przelicza poziomy.</summary>
    Task<(int NewXp, int NewLevel, bool LeveledUp)> AddXpAsync(int playerId, ProgressCategory category, int amount, string source, int? referenceId = null, CancellationToken ct = default);

    /// <summary>Pobierz postęp gracza we wszystkich kategoriach.</summary>
    Task<IEnumerable<Domain.Entities.Karaoke.Campaigns.PlayerProgress>> GetProgressAsync(int playerId, CancellationToken ct = default);

    /// <summary>Pobierz odblokowane skille gracza.</summary>
    Task<IEnumerable<Domain.Entities.Karaoke.Campaigns.PlayerSkill>> GetPlayerSkillsAsync(int playerId, CancellationToken ct = default);

    /// <summary>Odblokuj skill graczowi.</summary>
    Task<bool> UnlockSkillAsync(int playerId, int skillDefinitionId, int? campaignId = null, CancellationToken ct = default);
}
