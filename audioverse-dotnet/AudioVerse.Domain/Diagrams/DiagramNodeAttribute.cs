namespace AudioVerse.Domain.Diagrams;

/// <summary>
/// Oznacza encję do automatycznego umieszczenia na diagramie .drawio.
/// Generator skanuje assembly i tworzy diagramy ER na podstawie tych atrybutów.
/// </summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
public sealed class DiagramNodeAttribute : Attribute
{
    /// <summary>Grupa/moduł na diagramie (np. "Events", "Karaoke", "Audio").</summary>
    public string Group { get; }

    /// <summary>Kolor wypełnienia w formacie hex (np. "#d5e8d4").</summary>
    public string FillColor { get; set; } = "#f5f5f5";

    /// <summary>Kolor obramowania w formacie hex.</summary>
    public string StrokeColor { get; set; } = "#666666";

    /// <summary>Emoji/ikona wyświetlana obok nazwy (np. "📅").</summary>
    public string Icon { get; set; } = "";

    /// <summary>Krótki opis wyświetlany na diagramie pod nazwą klasy.</summary>
    public string Description { get; set; } = "";

    public DiagramNodeAttribute(string group)
    {
        Group = group;
    }
}
