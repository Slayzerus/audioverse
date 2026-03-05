namespace AudioVerse.Domain.Diagrams;

/// <summary>
/// Wyklucza encję lub właściwość z automatycznych diagramów.
/// Przydatne dla encji technicznych (migration snapshots, identity tables).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
public sealed class DiagramIgnoreAttribute : Attribute
{
}
