using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for event lists and their items.
/// </summary>
public interface IEventListRepository
{
    // ── Lists ──

    Task<EventList?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<EventList?> GetByIdWithItemsAsync(int id, CancellationToken ct = default);
    Task<EventList?> GetByShareTokenAsync(string shareToken, CancellationToken ct = default);
    Task<IEnumerable<EventList>> GetByOwnerAsync(int userId, CancellationToken ct = default);
    Task<IEnumerable<EventList>> GetByOrganizationAsync(int organizationId, CancellationToken ct = default);
    Task<IEnumerable<EventList>> GetByLeagueAsync(int leagueId, CancellationToken ct = default);
    Task<IEnumerable<EventList>> GetPublicListsAsync(int page, int pageSize, CancellationToken ct = default);
    Task<EventList?> GetFavoritesListAsync(int userId, CancellationToken ct = default);

    Task<int> CreateAsync(EventList list, CancellationToken ct = default);
    Task<bool> UpdateAsync(EventList list, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    // ── Items ──

    Task<EventListItem?> GetItemByIdAsync(int itemId, CancellationToken ct = default);
    Task<int> AddItemAsync(EventListItem item, CancellationToken ct = default);
    Task<bool> RemoveItemAsync(int itemId, CancellationToken ct = default);
    Task<bool> UpdateItemAsync(EventListItem item, CancellationToken ct = default);
    Task<bool> IsEventInListAsync(int listId, int eventId, CancellationToken ct = default);

    // ── Bulk ──

    Task<int> AddItemsBulkAsync(int listId, IEnumerable<int> eventIds, int? addedByUserId, CancellationToken ct = default);
    Task<int> RemoveItemsBulkAsync(int listId, IEnumerable<int> eventIds, CancellationToken ct = default);
    Task<int> MoveItemsAsync(int sourceListId, int targetListId, IEnumerable<int> eventIds, CancellationToken ct = default);
    Task<int> CopyItemsAsync(int sourceListId, int targetListId, IEnumerable<int> eventIds, int? addedByUserId, CancellationToken ct = default);
    Task ReorderItemsAsync(int listId, IEnumerable<(int ItemId, int NewOrder)> ordering, CancellationToken ct = default);
}
