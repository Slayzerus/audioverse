using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

public class EventListRepositoryEF(AudioVerseDbContext db) : IEventListRepository
{
    // ── Lists ──

    public async Task<EventList?> GetByIdAsync(int id, CancellationToken ct = default)
        => await db.EventLists.FindAsync([id], ct);

    public async Task<EventList?> GetByIdWithItemsAsync(int id, CancellationToken ct = default)
        => await db.EventLists.Include(l => l.Items).ThenInclude(i => i.Event)
            .FirstOrDefaultAsync(l => l.Id == id, ct);

    public async Task<EventList?> GetByShareTokenAsync(string shareToken, CancellationToken ct = default)
        => await db.EventLists.Include(l => l.Items).ThenInclude(i => i.Event)
            .FirstOrDefaultAsync(l => l.ShareToken == shareToken, ct);

    public async Task<IEnumerable<EventList>> GetByOwnerAsync(int userId, CancellationToken ct = default)
        => await db.EventLists.Where(l => l.OwnerUserId == userId)
            .OrderBy(l => l.SortOrder).ThenBy(l => l.Name)
            .ToListAsync(ct);

    public async Task<IEnumerable<EventList>> GetByOrganizationAsync(int organizationId, CancellationToken ct = default)
        => await db.EventLists.Where(l => l.OrganizationId == organizationId)
            .OrderBy(l => l.SortOrder).ThenBy(l => l.Name)
            .ToListAsync(ct);

    public async Task<IEnumerable<EventList>> GetByLeagueAsync(int leagueId, CancellationToken ct = default)
        => await db.EventLists.Where(l => l.LeagueId == leagueId)
            .OrderBy(l => l.SortOrder).ThenBy(l => l.Name)
            .ToListAsync(ct);

    public async Task<IEnumerable<EventList>> GetPublicListsAsync(int page, int pageSize, CancellationToken ct = default)
        => await db.EventLists.Where(l => l.Visibility == EventListVisibility.Public)
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

    public async Task<EventList?> GetFavoritesListAsync(int userId, CancellationToken ct = default)
        => await db.EventLists.Include(l => l.Items)
            .FirstOrDefaultAsync(l => l.OwnerUserId == userId && l.Type == EventListType.Favorites, ct);

    public async Task<int> CreateAsync(EventList list, CancellationToken ct = default)
    {
        db.EventLists.Add(list);
        await db.SaveChangesAsync(ct);
        return list.Id;
    }

    public async Task<bool> UpdateAsync(EventList list, CancellationToken ct = default)
    {
        var existing = await db.EventLists.FindAsync([list.Id], ct);
        if (existing == null) return false;

        existing.Name = list.Name;
        existing.Description = list.Description;
        existing.Type = list.Type;
        existing.Visibility = list.Visibility;
        existing.IconKey = list.IconKey;
        existing.Color = list.Color;
        existing.IsPinned = list.IsPinned;
        existing.SortOrder = list.SortOrder;
        existing.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var list = await db.EventLists.Include(l => l.Items).FirstOrDefaultAsync(l => l.Id == id, ct);
        if (list == null) return false;
        db.EventListItems.RemoveRange(list.Items);
        db.EventLists.Remove(list);
        await db.SaveChangesAsync(ct);
        return true;
    }

    // ── Items ──

    public async Task<EventListItem?> GetItemByIdAsync(int itemId, CancellationToken ct = default)
        => await db.EventListItems.FindAsync([itemId], ct);

    public async Task<int> AddItemAsync(EventListItem item, CancellationToken ct = default)
    {
        db.EventListItems.Add(item);
        await db.SaveChangesAsync(ct);
        return item.Id;
    }

    public async Task<bool> RemoveItemAsync(int itemId, CancellationToken ct = default)
    {
        var item = await db.EventListItems.FindAsync([itemId], ct);
        if (item == null) return false;
        db.EventListItems.Remove(item);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UpdateItemAsync(EventListItem item, CancellationToken ct = default)
    {
        var existing = await db.EventListItems.FindAsync([item.Id], ct);
        if (existing == null) return false;
        existing.Note = item.Note;
        existing.Tags = item.Tags;
        existing.SortOrder = item.SortOrder;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> IsEventInListAsync(int listId, int eventId, CancellationToken ct = default)
        => await db.EventListItems.AnyAsync(i => i.EventListId == listId && i.EventId == eventId, ct);

    // ── Bulk ──

    public async Task<int> AddItemsBulkAsync(int listId, IEnumerable<int> eventIds, int? addedByUserId, CancellationToken ct = default)
    {
        var existingIds = await db.EventListItems
            .Where(i => i.EventListId == listId)
            .Select(i => i.EventId)
            .ToListAsync(ct);

        var maxOrder = existingIds.Count > 0
            ? await db.EventListItems.Where(i => i.EventListId == listId).MaxAsync(i => i.SortOrder, ct)
            : 0;

        var newItems = eventIds.Where(id => !existingIds.Contains(id))
            .Select((id, idx) => new EventListItem
            {
                EventListId = listId,
                EventId = id,
                AddedByUserId = addedByUserId,
                SortOrder = maxOrder + idx + 1
            }).ToList();

        db.EventListItems.AddRange(newItems);
        await db.SaveChangesAsync(ct);
        return newItems.Count;
    }

    public async Task<int> RemoveItemsBulkAsync(int listId, IEnumerable<int> eventIds, CancellationToken ct = default)
    {
        var items = await db.EventListItems
            .Where(i => i.EventListId == listId && eventIds.Contains(i.EventId))
            .ToListAsync(ct);
        db.EventListItems.RemoveRange(items);
        await db.SaveChangesAsync(ct);
        return items.Count;
    }

    public async Task<int> MoveItemsAsync(int sourceListId, int targetListId, IEnumerable<int> eventIds, CancellationToken ct = default)
    {
        var items = await db.EventListItems
            .Where(i => i.EventListId == sourceListId && eventIds.Contains(i.EventId))
            .ToListAsync(ct);
        foreach (var item in items)
            item.EventListId = targetListId;
        await db.SaveChangesAsync(ct);
        return items.Count;
    }

    public async Task<int> CopyItemsAsync(int sourceListId, int targetListId, IEnumerable<int> eventIds, int? addedByUserId, CancellationToken ct = default)
    {
        var sourceItems = await db.EventListItems
            .Where(i => i.EventListId == sourceListId && eventIds.Contains(i.EventId))
            .ToListAsync(ct);

        var existingInTarget = await db.EventListItems
            .Where(i => i.EventListId == targetListId)
            .Select(i => i.EventId)
            .ToListAsync(ct);

        var newItems = sourceItems.Where(s => !existingInTarget.Contains(s.EventId))
            .Select(s => new EventListItem
            {
                EventListId = targetListId,
                EventId = s.EventId,
                Note = s.Note,
                Tags = s.Tags,
                AddedByUserId = addedByUserId
            }).ToList();

        db.EventListItems.AddRange(newItems);
        await db.SaveChangesAsync(ct);
        return newItems.Count;
    }

    public async Task ReorderItemsAsync(int listId, IEnumerable<(int ItemId, int NewOrder)> ordering, CancellationToken ct = default)
    {
        var items = await db.EventListItems.Where(i => i.EventListId == listId).ToListAsync(ct);
        foreach (var (itemId, newOrder) in ordering)
        {
            var item = items.FirstOrDefault(i => i.Id == itemId);
            if (item != null) item.SortOrder = newOrder;
        }
        await db.SaveChangesAsync(ct);
    }
}
