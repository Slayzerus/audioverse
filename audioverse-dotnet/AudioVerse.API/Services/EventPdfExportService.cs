using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Services;

public class EventPdfExportService
{
    private readonly AudioVerseDbContext _db;

    public EventPdfExportService(AudioVerseDbContext db) => _db = db;

    public async Task<byte[]> GenerateAsync(int eventId)
    {
        var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new KeyNotFoundException($"Event {eventId} not found");

        var schedule = await _db.EventScheduleItems
            .Where(s => s.EventId == eventId)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        var menu = await _db.EventMenuItems
            .Where(m => m.EventId == eventId)
            .OrderBy(m => m.Category).ThenBy(m => m.Name)
            .ToListAsync();

        var participants = await _db.KaraokeEventPlayers
            .Where(p => p.EventId == eventId)
            .ToListAsync();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text(ev.Title).FontSize(22).Bold();
                    col.Item().Text($"{ev.StartTime:yyyy-MM-dd HH:mm} UTC").FontSize(12).Italic();
                    if (!string.IsNullOrEmpty(ev.Description))
                        col.Item().PaddingTop(5).Text(ev.Description).FontSize(10);
                    col.Item().PaddingTop(10).LineHorizontal(1);
                });

                page.Content().PaddingTop(15).Column(col =>
                {
                    // Schedule
                    if (schedule.Count > 0)
                    {
                        col.Item().Text("Harmonogram").FontSize(16).Bold();
                        col.Item().PaddingTop(5).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(100);
                                c.RelativeColumn();
                                c.ConstantColumn(80);
                            });
                            table.Header(h =>
                            {
                                h.Cell().Text("Godzina").Bold();
                                h.Cell().Text("Tytuł").Bold();
                                h.Cell().Text("Kategoria").Bold();
                            });
                            foreach (var s in schedule)
                            {
                                table.Cell().Text(s.StartTime.ToString("HH:mm"));
                                table.Cell().Text(s.Title);
                                table.Cell().Text(s.Category.ToString());
                            }
                        });
                        col.Item().PaddingTop(10);
                    }

                    // Menu
                    if (menu.Count > 0)
                    {
                        col.Item().Text("Menu").FontSize(16).Bold();
                        col.Item().PaddingTop(5).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn();
                                c.ConstantColumn(80);
                                c.ConstantColumn(60);
                            });
                            table.Header(h =>
                            {
                                h.Cell().Text("Pozycja").Bold();
                                h.Cell().Text("Kategoria").Bold();
                                h.Cell().Text("Cena").Bold();
                            });
                            foreach (var m in menu)
                            {
                                table.Cell().Text(m.Name);
                                table.Cell().Text(m.Category.ToString());
                                table.Cell().Text(m.Price?.ToString("C") ?? "-");
                            }
                        });
                        col.Item().PaddingTop(10);
                    }

                    // Participants
                    col.Item().Text($"Uczestnicy ({participants.Count})").FontSize(16).Bold();
                    if (participants.Count > 0)
                    {
                        col.Item().PaddingTop(5).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(40);
                                c.RelativeColumn();
                            });
                            table.Header(h =>
                            {
                                h.Cell().Text("#").Bold();
                                h.Cell().Text("Player ID").Bold();
                            });
                            int i = 1;
                            foreach (var p in participants)
                            {
                                table.Cell().Text(i.ToString());
                                table.Cell().Text(p.PlayerId.ToString());
                                i++;
                            }
                        });
                    }
                    else
                    {
                        col.Item().PaddingTop(5).Text("Brak zarejestrowanych uczestników.");
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("AudioVerse — wygenerowano ");
                    t.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")).Italic();
                    t.Span(" | Strona ");
                    t.CurrentPageNumber();
                    t.Span(" z ");
                    t.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }
}
