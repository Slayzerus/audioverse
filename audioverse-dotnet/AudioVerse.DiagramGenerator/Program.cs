using System.Reflection;
using AudioVerse.DiagramGenerator;

// ─── AudioVerse Diagram Generator ───
// Skanuje AudioVerse.Domain po atrybutach [DiagramNode] / [DiagramRelation]
// i generuje:
//   1. .drawio — do otwarcia w draw.io / VS Code
//   2. .json  — lekki format dla React frontend
//
// Użycie:
//   dotnet run --project AudioVerse.DiagramGenerator [ścieżka-wyjściowa]
//
// Domyślna ścieżka: AudioVerse.API/Docs/diagrams/auto-data-model.drawio

var outputPath = args.Length > 0
    ? args[0]
    : Path.Combine("..", "AudioVerse.API", "Docs", "diagrams", "auto-data-model.drawio");

Console.WriteLine("╔══════════════════════════════════════════╗");
Console.WriteLine("║  AudioVerse Diagram Generator            ║");
Console.WriteLine("╚══════════════════════════════════════════╝");
Console.WriteLine();

// Ładujemy assembly Domain (już jest referencja projektowa)
var domainAssembly = typeof(AudioVerse.Domain.Diagrams.DiagramNodeAttribute).Assembly;

Console.WriteLine($"Skanuję assembly: {domainAssembly.GetName().Name}");
Console.WriteLine();

// 1. Drawio XML
Console.WriteLine($"[1/2] .drawio → {Path.GetFullPath(outputPath)}");
DrawioGenerator.Generate(domainAssembly, outputPath);

// 2. JSON dla React frontend
var jsonPath = Path.ChangeExtension(outputPath, ".json");
Console.WriteLine($"[2/2] .json → {Path.GetFullPath(jsonPath)}");
JsonDiagramGenerator.Generate(domainAssembly, jsonPath);

Console.WriteLine();
Console.WriteLine("Gotowe! Otwórz plik w draw.io lub VS Code z rozszerzeniem Draw.io Integration.");
