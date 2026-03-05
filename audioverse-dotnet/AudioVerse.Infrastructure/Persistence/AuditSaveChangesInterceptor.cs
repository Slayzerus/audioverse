using System.Text.Json;
using AudioVerse.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace AudioVerse.Infrastructure.Persistence;

/// <summary>
/// EF SaveChanges interceptor that automatically logs entity changes
/// (Added, Modified, Deleted) to the EntityChangeLogs table.
/// </summary>
public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
    {
        if (eventData.Context is AudioVerseDbContext db)
            RecordChanges(db);

        return base.SavingChangesAsync(eventData, result, ct);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is AudioVerseDbContext db)
            RecordChanges(db);

        return base.SavingChanges(eventData, result);
    }

    private static void RecordChanges(AudioVerseDbContext db)
    {
        var entries = db.ChangeTracker.Entries()
            .Where(e => e.Entity is not EntityChangeLog &&
                        e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        foreach (var entry in entries)
        {
            var entityName = entry.Entity.GetType().Name;
            var primaryKey = entry.Properties
                .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? "?";

            var log = new EntityChangeLog
            {
                EntityName = entityName,
                EntityId = primaryKey,
                Action = entry.State.ToString(),
                Timestamp = DateTime.UtcNow
            };

            switch (entry.State)
            {
                case EntityState.Added:
                    log.NewValues = SerializeProperties(entry.Properties
                        .Where(p => p.CurrentValue != null)
                        .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));
                    break;

                case EntityState.Deleted:
                    log.OldValues = SerializeProperties(entry.Properties
                        .Where(p => p.OriginalValue != null)
                        .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));
                    break;

                case EntityState.Modified:
                    var changed = entry.Properties.Where(p => p.IsModified).ToList();
                    log.ChangedProperties = string.Join(",", changed.Select(p => p.Metadata.Name));
                    log.OldValues = SerializeProperties(changed.ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));
                    log.NewValues = SerializeProperties(changed.ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));
                    break;
            }

            db.EntityChangeLogs.Add(log);
        }
    }

    private static string? SerializeProperties(Dictionary<string, object?> props) =>
        props.Count == 0 ? null : JsonSerializer.Serialize(props, new JsonSerializerOptions { WriteIndented = false });
}
