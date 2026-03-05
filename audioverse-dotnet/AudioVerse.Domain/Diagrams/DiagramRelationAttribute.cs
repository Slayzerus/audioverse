namespace AudioVerse.Domain.Diagrams;

/// <summary>
/// Oznacza właściwość nawigacyjną jako relację na diagramie ER.
/// Generator rysuje strzałkę od bieżącej encji do typu docelowego.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
public sealed class DiagramRelationAttribute : Attribute
{
    /// <summary>Etykieta relacji (np. "1:N", "N:M", "1:1").</summary>
    public string Label { get; set; } = "1:N";

    /// <summary>Styl strzałki: "solid" lub "dashed".</summary>
    public string LineStyle { get; set; } = "solid";
}
