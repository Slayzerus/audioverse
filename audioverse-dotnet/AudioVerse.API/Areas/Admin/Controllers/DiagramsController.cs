using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Admin.Controllers;

/// <summary>
/// Serwuje automatycznie wygenerowane diagramy modelu danych.
/// Pliki generowane post-build przez AudioVerse.DiagramGenerator.
/// </summary>
[ApiController]
[Route("api/admin/diagrams")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
[Tags("Admin — Diagrams")]
public class DiagramsController : ControllerBase
{
    private static readonly string DiagramsDir = Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "Docs", "diagrams");

    /// <summary>
    /// Pobierz auto-wygenerowany diagram modelu danych w formacie JSON.
    /// Gotowy do renderowania w React (React Flow / D3 / custom).
    /// </summary>
    [HttpGet("data-model")]
    public IActionResult GetDataModelJson()
    {
        var jsonPath = Path.Combine(DiagramsDir, "auto-data-model.json");
        if (!System.IO.File.Exists(jsonPath))
            return NotFound(new { error = "Diagram JSON nie został jeszcze wygenerowany. Uruchom build." });

        var json = System.IO.File.ReadAllText(jsonPath);
        return Content(json, "application/json");
    }

    /// <summary>
    /// Pobierz auto-wygenerowany diagram w formacie .drawio (XML).
    /// Do otwarcia w draw.io lub VS Code.
    /// </summary>
    [HttpGet("data-model/drawio")]
    public IActionResult GetDataModelDrawio()
    {
        var drawioPath = Path.Combine(DiagramsDir, "auto-data-model.drawio");
        if (!System.IO.File.Exists(drawioPath))
            return NotFound(new { error = "Diagram .drawio nie został jeszcze wygenerowany." });

        return PhysicalFile(Path.GetFullPath(drawioPath), "application/xml", "auto-data-model.drawio");
    }

    /// <summary>
    /// Lista wszystkich dostępnych diagramów (.drawio) w katalogu Docs/diagrams.
    /// </summary>
    [HttpGet]
    public IActionResult ListDiagrams()
    {
        if (!Directory.Exists(DiagramsDir))
            return Ok(Array.Empty<object>());

        var files = Directory.GetFiles(DiagramsDir, "*.drawio")
            .Select(f => new
            {
                name = Path.GetFileName(f),
                sizeBytes = new FileInfo(f).Length,
                lastModified = new FileInfo(f).LastWriteTimeUtc,
                hasJson = System.IO.File.Exists(Path.ChangeExtension(f, ".json")),
            })
            .OrderBy(f => f.name)
            .ToList();

        return Ok(files);
    }
}
