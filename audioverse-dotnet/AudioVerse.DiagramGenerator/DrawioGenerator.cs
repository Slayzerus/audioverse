using System.Reflection;
using System.Text;
using System.Xml.Linq;
using AudioVerse.Domain.Diagrams;

namespace AudioVerse.DiagramGenerator;

/// <summary>
/// Skanuje załadowane assembly w poszukiwaniu [DiagramNode] i [DiagramRelation],
/// generuje plik .drawio z diagramem ER pogrupowanym wg modułów.
/// </summary>
public static class DrawioGenerator
{
    private const int NodeWidth = 260;
    private const int NodeHeaderHeight = 36;
    private const int PropertyRowHeight = 18;
    private const int GroupPadding = 40;
    private const int NodeSpacingX = 300;
    private const int NodeSpacingY = 40;
    private const int GroupSpacingX = 50;

    public static void Generate(Assembly assembly, string outputPath)
    {
        var nodes = DiscoverNodes(assembly);
        var relations = DiscoverRelations(nodes);

        var xml = BuildDrawio(nodes, relations);
        Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
        File.WriteAllText(outputPath, xml, Encoding.UTF8);

        Console.WriteLine($"[DiagramGenerator] Wygenerowano {outputPath}");
        Console.WriteLine($"  → {nodes.Count} encji, {relations.Count} relacji");
    }

    private static List<NodeInfo> DiscoverNodes(Assembly assembly)
    {
        var result = new List<NodeInfo>();

        foreach (var type in assembly.GetExportedTypes())
        {
            if (type.GetCustomAttribute<DiagramIgnoreAttribute>() is not null)
                continue;

            var attr = type.GetCustomAttribute<DiagramNodeAttribute>();
            if (attr is null) continue;

            var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(p => p.GetCustomAttribute<DiagramIgnoreAttribute>() is null)
                .Where(p => IsSimpleProperty(p))
                .Select(p => FormatProperty(p))
                .ToList();

            result.Add(new NodeInfo
            {
                Type = type,
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

    private static List<RelationInfo> DiscoverRelations(List<NodeInfo> nodes)
    {
        var nodeTypes = nodes.Select(n => n.Type).ToHashSet();
        var result = new List<RelationInfo>();

        foreach (var node in nodes)
        {
            foreach (var prop in node.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            {
                if (prop.GetCustomAttribute<DiagramIgnoreAttribute>() is not null)
                    continue;

                var relAttr = prop.GetCustomAttribute<DiagramRelationAttribute>();
                if (relAttr is null) continue;

                var targetType = GetNavigationType(prop.PropertyType);
                if (targetType is null || !nodeTypes.Contains(targetType)) continue;

                result.Add(new RelationInfo
                {
                    SourceType = node.Type,
                    TargetType = targetType,
                    Label = relAttr.Label,
                    Dashed = relAttr.LineStyle == "dashed",
                    PropertyName = prop.Name
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
                {
                    return propType.GetGenericArguments()[0];
                }
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
        var nullable = Nullable.GetUnderlyingType(p.PropertyType) is not null ||
                       (!p.PropertyType.IsValueType && p.GetCustomAttribute<System.Runtime.CompilerServices.NullableAttribute>() is not null);
        var typeName = t.Name switch
        {
            "Int32" => "int",
            "Int64" => "long",
            "String" => "string",
            "Boolean" => "bool",
            "Single" => "float",
            "Double" => "double",
            "Decimal" => "decimal",
            _ when t.IsEnum => t.Name,
            _ => t.Name
        };
        return $"{typeName}{(nullable ? "?" : "")} {p.Name}";
    }

    private static string BuildDrawio(List<NodeInfo> nodes, List<RelationInfo> relations)
    {
        var groups = nodes.GroupBy(n => n.Group).OrderBy(g => g.Key).ToList();
        int nextId = 10;
        string NewId() => (nextId++).ToString();

        var cellsXml = new StringBuilder();
        var nodeIdMap = new Dictionary<Type, string>();

        int groupX = 40;
        int groupY = 80;

        // Tytuł
        var titleId = NewId();
        cellsXml.AppendLine($"        <mxCell id=\"{titleId}\" value=\"AudioVerse - Model danych (auto-generated)\" style=\"text;html=0;fontSize=20;fontStyle=1;align=center;\" vertex=\"1\" parent=\"1\">");
        cellsXml.AppendLine("          <mxGeometry x=\"400\" y=\"20\" width=\"600\" height=\"40\" as=\"geometry\"/>");
        cellsXml.AppendLine("        </mxCell>");

        foreach (var group in groups)
        {
            var groupNodes = group.ToList();
            int nodesPerRow = Math.Max(1, (int)Math.Ceiling(Math.Sqrt(groupNodes.Count)));
            int col = 0;
            int row = 0;
            int maxRowHeight = 0;
            int maxGroupWidth = 0;
            int maxGroupHeight = 0;

            var groupId = NewId();
            int nodeStartX = groupX + 24;
            int nodeStartY = groupY + 44;
            int nodeX = nodeStartX;
            int nodeY = nodeStartY;

            // Generuj węzły — osobny nagłówek + lista właściwości (styl ER)
            foreach (var node in groupNodes)
            {
                var containerId = NewId();
                var headerId = NewId();
                var propsId = NewId();
                nodeIdMap[node.Type] = containerId;

                int propsHeight = Math.Max(20, node.Properties.Count * PropertyRowHeight + 8);
                int nodeHeight = NodeHeaderHeight + propsHeight;
                if (!string.IsNullOrEmpty(node.Description))
                    nodeHeight += 18;

                // Kontener (cały box)
                cellsXml.AppendLine($"        <mxCell id=\"{containerId}\" value=\"\" style=\"shape=table;startSize=0;container=1;collapsible=0;childLayout=tableLayout;fixedRows=0;rowLines=0;fontStyle=0;strokeColor={node.StrokeColor};fillColor={node.FillColor};rounded=1;arcSize=8;shadow=1;\" vertex=\"1\" parent=\"1\">");
                cellsXml.AppendLine($"          <mxGeometry x=\"{nodeX}\" y=\"{nodeY}\" width=\"{NodeWidth}\" height=\"{nodeHeight}\" as=\"geometry\"/>");
                cellsXml.AppendLine("        </mxCell>");

                // Nagłówek — bez ikon
                var headerText = node.Name;
                if (!string.IsNullOrEmpty(node.Description))
                    headerText += $"\n({node.Description})";
                cellsXml.AppendLine($"        <mxCell id=\"{headerId}\" value=\"{EscapeXml(headerText)}\" style=\"text;html=0;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;spacingLeft=6;spacingRight=6;spacingTop=4;spacingBottom=4;fillColor={node.StrokeColor};fontColor=#ffffff;strokeColor=none;rounded=1;arcSize=8;\" vertex=\"1\" parent=\"{containerId}\">");
                cellsXml.AppendLine($"          <mxGeometry width=\"{NodeWidth}\" height=\"{NodeHeaderHeight + (string.IsNullOrEmpty(node.Description) ? 0 : 18)}\" as=\"geometry\"/>");
                cellsXml.AppendLine("        </mxCell>");

                // Właściwości
                var propsText = string.Join("\n", node.Properties);
                cellsXml.AppendLine($"        <mxCell id=\"{propsId}\" value=\"{EscapeXml(propsText)}\" style=\"text;html=0;fontSize=10;align=left;verticalAlign=top;spacingLeft=10;spacingRight=6;spacingTop=6;spacingBottom=6;fillColor={node.FillColor};strokeColor=none;\" vertex=\"1\" parent=\"{containerId}\">");
                cellsXml.AppendLine($"          <mxGeometry y=\"{NodeHeaderHeight + (string.IsNullOrEmpty(node.Description) ? 0 : 18)}\" width=\"{NodeWidth}\" height=\"{propsHeight}\" as=\"geometry\"/>");
                cellsXml.AppendLine("        </mxCell>");

                maxRowHeight = Math.Max(maxRowHeight, nodeHeight);
                col++;
                if (col >= nodesPerRow)
                {
                    col = 0;
                    row++;
                    maxGroupWidth = Math.Max(maxGroupWidth, nodeX + NodeWidth - groupX + 20);
                    nodeX = nodeStartX;
                    nodeY += maxRowHeight + NodeSpacingY;
                    maxRowHeight = 0;
                }
                else
                {
                    nodeX += NodeSpacingX;
                }
            }

            maxGroupWidth = Math.Max(maxGroupWidth, nodeX + NodeWidth - groupX + 24);
            maxGroupHeight = nodeY + maxRowHeight + 24 - groupY;
            if (col == 0 && row > 0)
                maxGroupHeight = nodeY + 24 - groupY;

            // Ramka grupy (wstawiana przed węzłami - na samym początku XML)
            var groupCell = $"        <mxCell id=\"{groupId}\" value=\"{EscapeXml(group.Key)}\" style=\"rounded=1;whiteSpace=wrap;html=0;fontStyle=1;fillColor=#f5f5f5;strokeColor=#999999;verticalAlign=top;fontSize=14;spacingTop=6;dashed=1;dashPattern=8 4;shadow=0;arcSize=6;\" vertex=\"1\" parent=\"1\">\n          <mxGeometry x=\"{groupX}\" y=\"{groupY}\" width=\"{maxGroupWidth}\" height=\"{maxGroupHeight}\" as=\"geometry\"/>\n        </mxCell>\n";
            cellsXml.Insert(cellsXml.ToString().IndexOf($"<mxCell id=\"{nodeIdMap[groupNodes[0].Type]}\""), groupCell);

            groupX += maxGroupWidth + GroupSpacingX;
            if (groupX > 1600)
            {
                groupX = 40;
                groupY += maxGroupHeight + 60;
            }
        }

        // Relacje — entityRelationEdgeStyle avoids routing through boxes
        foreach (var rel in relations)
        {
            if (!nodeIdMap.TryGetValue(rel.SourceType, out var srcId)) continue;
            if (!nodeIdMap.TryGetValue(rel.TargetType, out var tgtId)) continue;

            var edgeId = NewId();
            var dashStyle = rel.Dashed ? "dashed=1;" : "";
            cellsXml.AppendLine($"        <mxCell id=\"{edgeId}\" value=\"{EscapeXml(rel.Label)}\" style=\"edgeStyle=entityRelationEdgeStyle;rounded=1;{dashStyle}fontSize=9;labelBackgroundColor=#ffffff;strokeWidth=1.5;\" edge=\"1\" source=\"{srcId}\" target=\"{tgtId}\" parent=\"1\">");
            cellsXml.AppendLine("          <mxGeometry relative=\"1\" as=\"geometry\"/>");
            cellsXml.AppendLine("        </mxCell>");
        }

        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd");
        return $"""
            <mxfile host="AudioVerse.DiagramGenerator" modified="{timestamp}" type="device">
              <diagram id="auto-er" name="Data Model (auto-generated)">
                <mxGraphModel dx="2000" dy="1400" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3000" pageHeight="2000" math="0" shadow="0">
                  <root>
                    <mxCell id="0"/>
                    <mxCell id="1" parent="0"/>
            {cellsXml}
                  </root>
                </mxGraphModel>
              </diagram>
            </mxfile>
            """;
    }

    private static string EscapeXml(string s) =>
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");
}

public class NodeInfo
{
    public Type Type { get; set; } = null!;
    public string Name { get; set; } = "";
    public string Group { get; set; } = "";
    public string FillColor { get; set; } = "#f5f5f5";
    public string StrokeColor { get; set; } = "#666666";
    public string Icon { get; set; } = "";
    public string Description { get; set; } = "";
    public List<string> Properties { get; set; } = new();
}

public class RelationInfo
{
    public Type SourceType { get; set; } = null!;
    public Type TargetType { get; set; } = null!;
    public string Label { get; set; } = "";
    public bool Dashed { get; set; }
    public string PropertyName { get; set; } = "";
}
