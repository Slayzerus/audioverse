namespace AudioVerse.Domain.Entities.Admin;

/// <summary>
/// Nadpisanie widoczności feature'a w UI (delta od domyślnych ustawień frontendu).
/// Powiązane z aktywną SystemConfiguration.
/// </summary>
public class FeatureVisibilityOverride
{
    public int Id { get; set; }

    /// <summary>Powiązanie z wersją konfiguracji systemowej.</summary>
    public int SystemConfigurationId { get; set; }
    public SystemConfiguration? SystemConfiguration { get; set; }

    /// <summary>Stabilny identyfikator feature'a (np. "nav-social", "betting", "mini-games").</summary>
    public string FeatureId { get; set; } = string.Empty;

    /// <summary>Czy feature jest ukryty (true = admin ukrył tę sekcję).</summary>
    public bool Hidden { get; set; }

    /// <summary>Role, dla których feature jest widoczny (puste = wszyscy). JSON array lub CSV.</summary>
    public List<string> VisibleToRoles { get; set; } = [];
}
