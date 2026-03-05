namespace AudioVerse.API.Models.Admin;

/// <summary>Pojedyncze nadpisanie widoczności feature'a.</summary>
public class FeatureVisibilityOverrideDto
{
    /// <summary>Stabilny identyfikator feature'a (np. "nav-social", "betting").</summary>
    public string FeatureId { get; set; } = string.Empty;

    /// <summary>Czy feature jest ukryty.</summary>
    public bool Hidden { get; set; }

    /// <summary>Role, dla których feature jest widoczny (puste = wszyscy).</summary>
    public List<string> VisibleToRoles { get; set; } = [];
}
