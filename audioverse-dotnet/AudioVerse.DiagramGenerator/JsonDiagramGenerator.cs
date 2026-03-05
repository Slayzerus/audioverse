using System.Text.Json;
using System.Text.Json.Serialization;
using System.Reflection;
using AudioVerse.Domain.Diagrams;

namespace AudioVerse.DiagramGenerator;

/// <summary>
/// Generuje diagram w formacie JSON — lekki format do konsumpcji
/// przez React frontend (bez konieczności parsowania XML .drawio).
/// Struktura zgodna z React Flow / dowolnym rendererem grafów.
/// </summary>
public static class JsonDiagramGenerator
{
    public static void Generate(Assembly assembly, string outputPath)
    {
        var nodes = DiscoverNodes(assembly);
        var edges = DiscoverEdges(nodes);

        var diagram = new DiagramJson
        {
            GeneratedAt = DateTime.UtcNow.ToString("o"),
            Generator = "AudioVerse.DiagramGenerator",
            Groups = nodes
                .GroupBy(n => n.Group)
                .OrderBy(g => g.Key)
                .Select(g => new DiagramGroupJson
                {
                    Name = g.Key,
                    FillColor = g.First().FillColor,
                    StrokeColor = g.First().StrokeColor,
                    Nodes = g.Select(n => new DiagramNodeJson
                    {
                        Id = n.TypeFullName,
                        Name = n.Name,
                        Icon = n.Icon,
                        Description = n.Description,
                        FillColor = n.FillColor,
                        StrokeColor = n.StrokeColor,
                        Properties = n.Properties
                    }).ToList()
                }).ToList(),
            Edges = edges
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
        File.WriteAllText(outputPath, JsonSerializer.Serialize(diagram, options));

        Console.WriteLine($"[DiagramGenerator] JSON → {outputPath}");
        Console.WriteLine($"  → {nodes.Count} encji, {edges.Count} relacji");
    }

    private static List<NodeData> DiscoverNodes(Assembly assembly)
    {
        var result = new List<NodeData>();

        foreach (var type in assembly.GetExportedTypes())
        {
            if (type.GetCustomAttribute<DiagramIgnoreAttribute>() is not null) continue;
            var attr = type.GetCustomAttribute<DiagramNodeAttribute>();
            if (attr is null) continue;

            var properties = type
                .GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(p => p.GetCustomAttribute<DiagramIgnoreAttribute>() is null)
                .Where(IsSimpleProperty)
                .Select(FormatProperty)
                .ToList();

            result.Add(new NodeData
            {
                Type = type,
                TypeFullName = type.FullName ?? type.Name,
                Name = type.Name,
                Group = attr.Group,
                FillColor = attr.FillColor,
                StrokeColor = attr.StrokeColor,
                Icon = attr.Icon,
                Description = attr.Description,
                Properties = properties
            });
        }

        return result;
    }

    private static List<DiagramEdgeJson> DiscoverEdges(List<NodeData> nodes)
    {
        var nodeTypes = nodes.Select(n => n.Type).ToHashSet();
        var result = new List<DiagramEdgeJson>();

        foreach (var node in nodes)
        {
            foreach (var prop in node.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            {
                if (prop.GetCustomAttribute<DiagramIgnoreAttribute>() is not null) continue;
                var relAttr = prop.GetCustomAttribute<DiagramRelationAttribute>();
                if (relAttr is null) continue;

                var targetType = GetNavigationType(prop.PropertyType);
                if (targetType is null || !nodeTypes.Contains(targetType)) continue;

                var targetNode = nodes.First(n => n.Type == targetType);

                result.Add(new DiagramEdgeJson
                {
                    Source = node.TypeFullName,
                    Target = targetNode.TypeFullName,
                    Label = relAttr.Label,
                    PropertyName = prop.Name,
                    Dashed = relAttr.LineStyle == "dashed"
                });
            }
        }

        return result;
    }

    private static Type? GetNavigationType(Type propType)
    {
        if (!propType.IsValueType && propType != typeof(string))
        {
            if (propType.IsGenericType)
            {
                var genDef = propType.GetGenericTypeDefinition();
                if (genDef == typeof(ICollection<>) || genDef == typeof(List<>) ||
                    genDef == typeof(IList<>) || genDef == typeof(IEnumerable<>))
                    return propType.GetGenericArguments()[0];
            }
            return propType;
        }
        return null;
    }

    private static bool IsSimpleProperty(PropertyInfo p)
    {
        var t = Nullable.GetUnderlyingType(p.PropertyType) ?? p.PropertyType;
        return t.IsPrimitive || t.IsEnum || t == typeof(string) ||
               t == typeof(DateTime) || t == typeof(DateTimeOffset) ||
               t == typeof(decimal) || t == typeof(Guid) ||
               t == typeof(TimeSpan) || t == typeof(DateOnly) || t == typeof(TimeOnly);
    }

    private static string FormatProperty(PropertyInfo p)
    {
        var t = Nullable.GetUnderlyingType(p.PropertyType) ?? p.PropertyType;
        var nullable = Nullable.GetUnderlyingType(p.PropertyType) is not null;
        var typeName = t.Name switch
        {
            "Int32" => "int",
            "Int64" => "long",
            "String" => "string",
            "Boolean" => "bool",
            "Single" => "float",
            "Double" => "double",
            "Decimal" => "decimal",
            _ => t.Name
        };
        return $"{typeName}{(nullable ? "?" : "")} {p.Name}";
    }

    private class NodeData
    {
        public Type Type { get; set; } = null!;
        public string TypeFullName { get; set; } = "";
        public string Name { get; set; } = "";
        public string Group { get; set; } = "";
        public string FillColor { get; set; } = "";
        public string StrokeColor { get; set; } = "";
        public string Icon { get; set; } = "";
        public string Description { get; set; } = "";
        public List<string> Properties { get; set; } = new();
    }
}

// ── JSON DTOs ──

public class DiagramJson
{
    public string GeneratedAt { get; set; } = "";
    public string Generator { get; set; } = "";
    public List<DiagramGroupJson> Groups { get; set; } = new();
    public List<DiagramEdgeJson> Edges { get; set; } = new();
}

public class DiagramGroupJson
{
    public string Name { get; set; } = "";
    public string FillColor { get; set; } = "";
    public string StrokeColor { get; set; } = "";
    public List<DiagramNodeJson> Nodes { get; set; } = new();
}

public class DiagramNodeJson
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public string Description { get; set; } = "";
    public string FillColor { get; set; } = "";
    public string StrokeColor { get; set; } = "";
    public List<string> Properties { get; set; } = new();
}

public class DiagramEdgeJson
{
    public string Source { get; set; } = "";
    public string Target { get; set; } = "";
    public string Label { get; set; } = "";
    public string PropertyName { get; set; } = "";
    public bool Dashed { get; set; }
}
